import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService";
import type { StockCSVRow, CombinationMapEntry, ProductOption, ProductOptionValue, CombinationPost, StockAvailablePut, StockAvailableGet, LValue, StockMovement } from "@shared/types/import";
import { extractIdValue } from "@shared/utils/extractIdValue";
import { ImportValidator } from "@shared/utils/import-validator";
import { ensureArray } from '@shared/utils/arrayUtils';

export const attributeMap = new Map<string, number>();
export const attributeValueMap = new Map<string, Map<string, number>>();
export const combinationMap = new Map<string, CombinationMapEntry>();

const toLValue = (text: string): LValue => ({
  language: {
    '@_id': 1,
    '#text': text
  }
});

export const importCombinationsAndStocks = async (csvFile: File): Promise<void> => {
  attributeMap.clear();
  attributeValueMap.clear();
  combinationMap.clear();
  const text = await csvFile.text();

  return new Promise((resolve, reject) => {
    Papa.parse<any>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const metaFields = (results.meta.fields || []).map(f => f.trim().replace(/^\uFEFF/, ''));
          const requiredCols = ['reference', 'specificité', 'karazany', 'stock_initial', 'prix_vente_ttc'];
          const optionalCols = ['date_add'];

          // 1. Validation des colonnes (insensible à la casse)
          const colMap = ImportValidator.validateColumns(metaFields, requiredCols);
          
          // Chercher les colonnes optionnelles
          const dateAddCol = metaFields.find(f => f.toLowerCase() === 'date_add');

          const cleanRows = results.data.map((row: any) => {
            const refVal = (row[colMap['reference']] || "").trim();
            const specVal = (row[colMap['specificité']] || "").trim();
            const valVal = (row[colMap['karazany']] || "").trim();
            const stockVal = (row[colMap['stock_initial']] || "").trim();
            const prixVal = (row[colMap['prix_vente_ttc']] || "").trim();
            const dateAddVal = dateAddCol ? (row[dateAddCol] || "").trim() : "";

            // 2. Validation : le stock_initial est obligatoire (mais peut être 0)
            ImportValidator.validatePositiveAmount(stockVal, 'stock_initial', true);

            // 3. Validation : le prix est OPTIONNEL (ex: produits simples), mais doit être positif SI fourni
            if (prixVal !== "") {
              ImportValidator.validatePositiveAmount(prixVal, 'prix_vente_ttc');
            }
            
            // 4. Validation date si présente
            if (dateAddVal) {
              ImportValidator.validateDateFormat(dateAddVal, 'date_add');
            }

            return {
              reference: refVal,
              specificite: specVal,
              valeur: valVal,
              stock_initial: stockVal,
              prix_vente_ttc: prixVal,
              date_add: dateAddVal
            } as StockCSVRow;
          });

          console.log("Parsed combinations:", cleanRows);
          await processCombinationsAndStocks(cleanRows);
          resolve();
        } catch (err) {
          console.error("Combination import failed validation:", err);
          reject(err);
        }
      },
      error: (err: any) => reject(err),
    });
  });
};

const processCombinationsAndStocks = async (rows: StockCSVRow[]) => {
  for (const row of rows) {
    const { reference, specificite, valeur, stock_initial } = row;

    if (!reference) {
      console.warn(`Skipping row due to missing reference: ${JSON.stringify(row)}`);
      continue;
    }

    const productData = productMap.get(reference);
    if (!productData) {
      console.warn(`Product not found for reference ${reference}. Skipping combination/stock.`);
      continue;
    }
    const productId = productData.id_product;

    // ========== PRODUIT SIMPLE (sans déclinaison) ==========
    if (!specificite) {
      try {
        const stockGetRes = await apiService.get<any>(
            `/stock_availables?filter[id_product]=${productId}&display=full`,
        );

        const rawSimple = stockGetRes?.prestashop?.stock_availables?.stock_available;
        const allSimpleStocks: StockAvailableGet[] = ensureArray(rawSimple);
        const simpleStock = allSimpleStocks.find(
            (s: any) => !s.id_product_attribute || extractIdValue(s.id_product_attribute) === '0'
        ) ?? allSimpleStocks[0];

        const stockId = simpleStock?.id ?? null;
        console.log(`Stock simple product ${productId}: stockId=${stockId}, entries=${allSimpleStocks.length}`);

        if (stockId) {
          const quantity = ImportValidator.validatePositiveAmount(stock_initial, 'stock_initial', true);
          const patchData = { id: Number(extractIdValue(stockId)), quantity: quantity };
          await apiService.patch(`/stock_availables/${extractIdValue(stockId)}`, { stock_available: patchData });
          console.log(`Stock updated for simple product ${productId}: qty=${quantity}`);

          try {
            let movementDate = row.date_add ? (row.date_add + ' 00:00:00') : "";
            if (!movementDate) {
              movementDate = (productData.available_date && productData.available_date !== '0000-00-00')
                ? productData.available_date + ' 00:00:00'
                : new Date().toISOString().slice(0, 19).replace('T', ' ');
            }
            const stockMovementPayload: StockMovement = {
              id_employee: 1,
              id_stock: Number(extractIdValue(stockId)),
              physical_quantity: quantity,
              sign: 1,
              id_stock_mvt_reason: 1,
              price_te: 0,
              date_add: movementDate,
            };

            const mvtRes = await apiService.post<any>('/stock_movements', {
              stock_mvt: stockMovementPayload
            });

            // PrestaShop écrase date_add en "now" au POST, on fait un PATCH direct pour forcer la date
            if (mvtRes?.prestashop?.stock_mvt?.id) {
              const mvtId = Number(extractIdValue(mvtRes.prestashop.stock_mvt.id));
              await apiService.patch(`/stock_movements/${mvtId}`, {
                stock_mvt: { id: mvtId, date_add: movementDate }
              });
            }
            console.log(`Created and updated stock movement date for simple product ${productId}`);
          } catch (mvtError) {
            console.error(`Failed to create stock movement for simple product ${productId}`, mvtError);
          }
          continue;
        }
      } catch (err) {
        console.error(`Error processing simple product stock for ${productId}`, err);
      }
      continue;
    }

    // ========== DÉCLINAISONS ==========
    if (!valeur) {
      console.warn(`Skipping row due to missing valeur for spécificité ${specificite}: ${JSON.stringify(row)}`);
      continue;
    }

    // ── Attribut (product_option) ──
    if (!attributeMap.has(specificite)) {
      try {
        const existing = await apiService.get<any>(
            `/product_options?filter[name]=${encodeURIComponent(specificite)}&display=full`
        );
        const existingOption = existing?.prestashop?.product_options?.product_option;
        const found = ensureArray(existingOption)[0];
        if (found?.id) {
          const id = Number(extractIdValue(found.id));
          attributeMap.set(specificite, id);
          if (!attributeValueMap.has(specificite)) attributeValueMap.set(specificite, new Map());
          console.log(`Attribute already exists: ${specificite} → ${id}`);
        }
      } catch (_) { /* pas trouvé */ }

      if (!attributeMap.has(specificite)) {
        const optionData: ProductOption = {
          group_type: 'select',
          name: toLValue(specificite),
          public_name: toLValue(specificite)
        };
        try {
          const response = await apiService.post<any>("/product_options", { product_option: optionData });
          const id = Number(extractIdValue(response?.prestashop?.product_option?.id));
          if (id) {
            attributeMap.set(specificite, id);
            attributeValueMap.set(specificite, new Map<string, number>());
            console.log(`Attribute created: ${specificite} → ${id}`);
          } else {
            continue;
          }
        } catch (err) {
          console.error(`Error creating product_option ${specificite}`, err);
          continue;
        }
      }
    }

    const attributeId = attributeMap.get(specificite);
    if (!attributeId) continue;

    // ── Valeur d'attribut (product_option_value) ──
    if (!attributeValueMap.has(specificite)) {
      attributeValueMap.set(specificite, new Map());
    }
    const valMap = attributeValueMap.get(specificite)!;

    if (!valMap.has(valeur)) {
      try {
        const existing = await apiService.get<any>(
            `/product_option_values?filter[id_attribute_group]=${attributeId}&filter[name]=${encodeURIComponent(valeur)}&display=full`
        );
        const existingVal = existing?.prestashop?.product_option_values?.product_option_value;
        const found = ensureArray(existingVal)[0];
        if (found?.id) {
          const id = Number(extractIdValue(found.id));
          valMap.set(valeur, id);
          console.log(`Attribute value already exists: ${valeur} → ${id}`);
        }
      } catch (_) { /* pas trouvée */ }

      if (!valMap.has(valeur)) {
        const optionValueData: ProductOptionValue = {
          id_attribute_group: attributeId,
          name: toLValue(valeur)
        };
        try {
          const response = await apiService.post<any>("/product_option_values", { product_option_value: optionValueData });
          const id = Number(extractIdValue(response?.prestashop?.product_option_value?.id));
          if (id) {
            valMap.set(valeur, id);
            console.log(`Attribute value created: ${valeur} → ${id}`);
          } else {
            continue;
          }
        } catch (err) {
          console.error(`Error creating product_option_value ${valeur}`, err);
          continue;
        }
      }
    }

    const attributeValueId = valMap.get(valeur);
    if (!attributeValueId) continue;

    // ── Combinaison ──
    const comboKey = `${reference}_${specificite}_${valeur}`;
    let combinationId = combinationMap.get(comboKey)?.id;

    if (!combinationId) {
      try {
        const existing = await apiService.get<any>(
            `/combinations?filter[id_product]=${productId}&display=full`
        );
        const combosRaw = existing?.prestashop?.combinations?.combination;
        const combosArr = ensureArray(combosRaw);
        
        for (const combo of combosArr) {
            const associations = combo.associations?.product_option_values?.product_option_value;
            const assocArr = ensureArray(associations);
            if (assocArr.some((a: any) => Number(extractIdValue(a.id)) === attributeValueId)) {
                combinationId = Number(extractIdValue(combo.id));
                combinationMap.set(comboKey, { id: combinationId, prix_ttc: productData.prix_ttc });
                console.log(`Combination already exists for ${comboKey} → ${combinationId}`);
                break;
            }
        }
      } catch (_) { /* pas trouvée */ }

      if (!combinationId) {
        let impactHt = 0;
        let prixVenteTtc = productData.prix_ttc;
        if (row.prix_vente_ttc) {
          const parsed = ImportValidator.validatePositiveAmount(row.prix_vente_ttc, 'prix_vente_ttc');
          prixVenteTtc = parsed;
          impactHt = (prixVenteTtc - productData.prix_ttc) / (1 + productData.rate / 100);
        }

        const combinationData: CombinationPost = {
          id_product: productId,
          reference: reference,
          price: parseFloat(impactHt.toFixed(6)),
          minimal_quantity: 1,
          associations: {
            product_option_values: {
              product_option_value: [{ id: attributeValueId }]
            }
          }
        };

        try {
          const response = await apiService.post<any>("/combinations", { combination: combinationData });
          const id = Number(extractIdValue(response?.prestashop?.combination?.id));
          if (id) {
            combinationId = id;
            combinationMap.set(comboKey, { id: combinationId, prix_ttc: prixVenteTtc });
            console.log(`Combination created: ${comboKey} → ${combinationId}`);
          }
        } catch (err) {
          console.error(`Error creating combination for ${comboKey}`, err);
          continue;
        }
      }
    }

    if (!combinationId) continue;

    // ── Stock déclinaison ──
    try {
      const stockGetRes = await apiService.get<any>(
          `/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=${combinationId}&display=full`,
      );

      const rawCombo = stockGetRes?.prestashop?.stock_availables?.stock_available;
      const allComboStocks: StockAvailableGet[] = ensureArray(rawCombo);
      const quantity = ImportValidator.validatePositiveAmount(stock_initial, 'stock_initial', true);

      if (allComboStocks.length > 0) {
        for (const stockRecord of allComboStocks) {
          const stockId = extractIdValue(stockRecord.id);
          const patchData = { id: Number(stockId), quantity: quantity };
          await apiService.patch(`/stock_availables/${stockId}`, { stock_available: patchData });
          console.log(`[combinationImport] Stock updated for combo ${combinationId} (ID Stock: ${stockId}) : qty=${quantity}`);
        }


        try {
          let movementDate = row.date_add ? (row.date_add + ' 00:00:00') : "";
          if (!movementDate) {
            movementDate = (productData.available_date && productData.available_date !== '0000-00-00')
                ? productData.available_date + ' 00:00:00'
                : new Date().toISOString().slice(0, 19).replace('T', ' ');
          }

          // Use the stockId from the current stockRecord in the loop
          const currentStockId = Number(extractIdValue(allComboStocks[0].id));

          const stockMovementPayload: StockMovement = {
            id_employee: 1,
            id_stock: currentStockId,
            physical_quantity: quantity,
            sign: 1,
            id_stock_mvt_reason: 1,
            price_te: 0,
            date_add: movementDate,
          };

          const mvtRes = await apiService.post<any>('/stock_movements', {
            stock_mvt: stockMovementPayload
          });
          
          // PrestaShop écrase date_add en "now" au POST, on fait un PATCH direct pour forcer la date
          if (mvtRes?.prestashop?.stock_mvt?.id) {
            const mvtId = Number(extractIdValue(mvtRes.prestashop.stock_mvt.id));
            await apiService.patch(`/stock_movements/${mvtId}`, {
              stock_mvt: { id: mvtId, date_add: movementDate }
            });
          }
          
          console.log(`[combinationImport] Stock movement created and date forced via PUT for combo ${combinationId}`);
        } catch (mvtError) {
          console.error(`[combinationImport] Failed stock movement for combo ${combinationId}`, mvtError);
        }
      } else {
        console.error(`[combinationImport] NO stock row found for combo ${combinationId}.`);
      }
    } catch (err) {
      console.error(`[combinationImport] Error processing stock for combo ${combinationId}`, err);
    }
  }
};
