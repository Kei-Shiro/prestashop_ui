import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap, getProductInfo } from "./productImportService";
import type { StockCSVRow, CombinationMapEntry } from "@shared/types/import";
import type { LangField } from "@shared/types/common";
import type { ProductOptionCreatePayload } from "@shared/types/product-option";
import type { ProductOptionValueCreatePayload } from "@shared/types/product-option-value";
import type { CombinationCreatePayload, Combination } from "@shared/types/combination";
import type { StockAvailableUpdatePayload, StockAvailable } from "@shared/types/stock-available";
import type { StockMovement } from "@shared/types/stock-movement";
import { extractIdValue, extractIdNumber } from "@shared/utils/extractIdValue";
import { ImportValidator } from "@shared/utils/import-validator";
import { ensureArray } from '@shared/utils/arrayUtils';
import { toLValue, extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { DomainPriceService } from '@shared/utils/priceUtils';
import { catalogLoader } from "@shared/services/catalog-loader";
import { toPrestashopDate } from '@shared/utils/dateUtils';

export const attributeMap = new Map<string, number>();
export const attributeValueMap = new Map<string, Map<string, number>>();
export const combinationMap = new Map<string, CombinationMapEntry>();


export const importCombinationsAndStocks = async (csvFile: File): Promise<void> => {
  attributeMap.clear();
  attributeValueMap.clear();
  combinationMap.clear();
  catalogLoader.clearCombinationCache();
  await catalogLoader.preloadStockCache();
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
          const stats = await processCombinationsAndStocks(cleanRows);
          if (stats.failed > 0) {
            throw new Error(`Import de déclinaisons terminé avec ${stats.failed} erreur(s) sur ${cleanRows.length} ligne(s).`);
          }
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

const processCombinationsAndStocks = async (rows: StockCSVRow[]): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;
  
  // Cache en mémoire pour les déclinaisons d'un même produit
  const productCombosCache = new Map<number, any[]>();

  for (const row of rows) {
    const { reference, specificite, valeur, stock_initial } = row;

    if (!reference) {
      console.warn(`Skipping row due to missing reference: ${JSON.stringify(row)}`);
      failed++;
      continue;
    }

    const productData = await getProductInfo(reference);
    if (!productData) {
      console.warn(`Product not found for reference ${reference}. Skipping combination/stock.`);
      failed++;
      continue;
    }
    const productId = productData.id_product;

    // ========== PRODUIT SIMPLE (sans déclinaison) ==========
    if (!specificite) {
      try {
        const cachedStock = catalogLoader.getCachedStock(productId, 0);
        let stockId = cachedStock ? String(cachedStock.id) : null;
        let currentQty = cachedStock ? cachedStock.quantity : 0;

        if (!stockId) {
          const stockGetRes = await apiService.get<any>(
              `/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=0&display=full`,
          );
          const rawSimple = stockGetRes?.prestashop?.stock_availables?.stock_available;
          const simpleStock = ensureArray(rawSimple)[0];
          stockId = simpleStock?.id ? extractIdValue(simpleStock.id) : null;
          currentQty = parseInt(extractIdValue(simpleStock?.quantity) || '0', 10);
        }

        if (stockId) {
          const quantity = ImportValidator.validatePositiveAmount(stock_initial, 'stock_initial', true);
          const delta = quantity - currentQty;

          const patchData = { id: Number(stockId), quantity: quantity };
          await apiService.patch(`/stock_availables/${stockId}`, { stock_available: patchData });
          console.log(`Stock updated for simple product ${productId}: qty=${quantity}`);

          if (delta !== 0) {
            try {
              let movementDate = row.date_add ? (row.date_add + ' 00:00:00') : "";
              if (!movementDate) {
                movementDate = (productData.available_date && productData.available_date !== '0000-00-00')
                  ? productData.available_date + ' 00:00:00'
                  : toPrestashopDate(new Date());
              }
              const stockMovementPayload: StockMovement = {
                id_employee: 1,
                id_stock: Number(stockId),
                physical_quantity: Math.abs(delta),
                sign: delta > 0 ? 1 : -1,
                id_stock_mvt_reason: 1,
                price_te: 0,
                date_add: movementDate,
              };

              const mvtRes = await apiService.post<any>('/stock_movements', {
                stock_mvt: stockMovementPayload
              });

              // PrestaShop écrase date_add en "now" au POST, on fait un PATCH direct pour forcer la date
              const newMvtId = extractIdValue(mvtRes?.prestashop?.stock_mvt?.id);
              if (newMvtId) {
                const mvtId = Number(newMvtId);
                await apiService.patch(`/stock_movements/${mvtId}`, {
                  stock_mvt: { id: mvtId, date_add: movementDate }
                });
              }
              console.log(`Created and updated stock movement date for simple product ${productId}`);
            } catch (mvtError) {
              console.error(`Failed to create stock movement for simple product ${productId}`, mvtError);
            }
          }
          success++;
          continue;
        } else {
          throw new Error(`Simple stock ID not found for product ${productId}`);
        }
      } catch (err) {
        console.error(`Error processing simple product stock for ${productId}`, err);
        failed++;
      }
      continue;
    }

    // ========== DÉCLINAISONS ==========
    if (!valeur) {
      console.warn(`Skipping row due to missing valeur for spécificité ${specificite}: ${JSON.stringify(row)}`);
      failed++;
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
        const extractedOptionId = extractIdValue(found?.id);
        if (extractedOptionId) {
          const id = Number(extractedOptionId);
          attributeMap.set(specificite, id);
          if (!attributeValueMap.has(specificite)) attributeValueMap.set(specificite, new Map());
          console.log(`Attribute already exists: ${specificite} → ${id}`);
        }
      } catch (_) { /* pas trouvé */ }

      if (!attributeMap.has(specificite)) {
        const optionData: ProductOptionCreatePayload = {
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
            failed++;
            continue;
          }
        } catch (err) {
          console.error(`Error creating product_option ${specificite}`, err);
          failed++;
          continue;
        }
      }
    }

    const attributeId = attributeMap.get(specificite);
    if (!attributeId) {
      failed++;
      continue;
    }

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
        const extractedValueId = extractIdValue(found?.id);
        if (extractedValueId) {
          const id = Number(extractedValueId);
          valMap.set(valeur, id);
          console.log(`Attribute value already exists: ${valeur} → ${id}`);
        }
      } catch (_) { /* pas trouvée */ }

      if (!valMap.has(valeur)) {
        const optionValueData: ProductOptionValueCreatePayload = {
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
            failed++;
            continue;
          }
        } catch (err) {
          console.error(`Error creating product_option_value ${valeur}`, err);
          failed++;
          continue;
        }
      }
    }

    const attributeValueId = valMap.get(valeur);
    if (!attributeValueId) {
      failed++;
      continue;
    }

    // ── Combinaison ──
    const comboKey = `${reference}_${specificite}_${valeur}`;
    let combinationId = combinationMap.get(comboKey)?.id;

    if (!combinationId) {
      try {
        // Utiliser le cache des combinaisons du produit
        let combosArr = productCombosCache.get(productId);
        if (!combosArr) {
          const existing = await apiService.get<any>(
              `/combinations?filter[id_product]=${productId}&display=full`
          );
          combosArr = ensureArray(existing?.prestashop?.combinations?.combination);
          productCombosCache.set(productId, combosArr);
        }
        
        for (const combo of combosArr) {
            const associations = combo.associations?.product_option_values?.product_option_value;
            const assocArr = ensureArray(associations);
            if (assocArr.some((a: any) => Number(extractIdValue(a.id)) === attributeValueId)) {
                combinationId = Number(extractIdValue(combo.id));
                const comboPrice = parseFloat(extractIdValue(combo.price) || '0');
                const prixVenteTtc = productData.prix_ttc + DomainPriceService.calculateTTC(comboPrice, productData.rate);
                combinationMap.set(comboKey, { id: combinationId, prix_ttc: prixVenteTtc });
                const mappedCombo: Combination = {
                  id: extractIdValue(combo.id),
                  id_product: String(productId),
                  reference: combo.reference || undefined,
                  price: combo.price || undefined,
                  wholesale_price: combo.wholesale_price || undefined,
                  associations: combo.associations
                };
                catalogLoader.registerCombination(productId, valeur, mappedCombo);
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
          impactHt = DomainPriceService.calculateCombinationImpactHT(prixVenteTtc, productData.prix_ttc, productData.rate);
        }

        const combinationData: CombinationCreatePayload = {
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
            const newCombo: Combination = {
              id: String(combinationId),
              id_product: String(productId),
              reference: combinationData.reference,
              price: String(combinationData.price),
              associations: combinationData.associations
            };
            catalogLoader.registerCombination(productId, valeur, newCombo);
            console.log(`Combination created: ${comboKey} → ${combinationId}`);
            
            // Invalider le cache des déclinaisons de ce produit pour le recharger si nécessaire
            productCombosCache.delete(productId);
          }
        } catch (err) {
          console.error(`Error creating combination for ${comboKey}`, err);
          failed++;
          continue;
        }
      }
    }

    if (!combinationId) {
      failed++;
      continue;
    }

    // ── Stock déclinaison ──
    try {
      const cachedStock = catalogLoader.getCachedStock(productId, combinationId);
      let stockId = cachedStock ? String(cachedStock.id) : null;
      let currentQty = cachedStock ? cachedStock.quantity : 0;
      let hasStockRecord = !!stockId;

      if (!stockId) {
        const stockGetRes = await apiService.get<any>(
            `/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=${combinationId}&display=full`,
        );
        const rawCombo = stockGetRes?.prestashop?.stock_availables?.stock_available;
        const allComboStocks = ensureArray(rawCombo);
        if (allComboStocks.length > 0) {
          stockId = extractIdValue(allComboStocks[0].id);
          currentQty = parseInt(extractIdValue(allComboStocks[0].quantity) || '0', 10);
          hasStockRecord = true;
        }
      }

      const quantity = ImportValidator.validatePositiveAmount(stock_initial, 'stock_initial', true);

      if (hasStockRecord && stockId) {
        const delta = quantity - currentQty;

        const patchData = { id: Number(stockId), quantity: quantity };
        await apiService.patch(`/stock_availables/${stockId}`, { stock_available: patchData });
        console.log(`[combinationImport] Stock updated for combo ${combinationId} (ID Stock: ${stockId}) : qty=${quantity}`);

        if (delta !== 0) {
          try {
            let movementDate = row.date_add ? (row.date_add + ' 00:00:00') : "";
            if (!movementDate) {
              movementDate = (productData.available_date && productData.available_date !== '0000-00-00')
                  ? productData.available_date + ' 00:00:00'
                  : toPrestashopDate(new Date());
            }

            const stockMovementPayload: StockMovement = {
              id_employee: 1,
              id_stock: Number(stockId),
              physical_quantity: Math.abs(delta),
              sign: delta > 0 ? 1 : -1,
              id_stock_mvt_reason: 1,
              price_te: 0,
              date_add: movementDate,
            };

            const mvtRes = await apiService.post<any>('/stock_movements', {
              stock_mvt: stockMovementPayload
            });
            
            const newMvtId = extractIdValue(mvtRes?.prestashop?.stock_mvt?.id);
            if (newMvtId) {
              const mvtId = Number(newMvtId);
              await apiService.patch(`/stock_movements/${mvtId}`, {
                stock_mvt: { id: mvtId, date_add: movementDate }
              });
            }
            
            console.log(`[combinationImport] Stock movement created and date forced via PATCH for combo ${combinationId}`);
          } catch (mvtError) {
            console.error(`[combinationImport] Failed stock movement for combo ${combinationId}`, mvtError);
          }
        }
        success++;
      } else {
        console.error(`[combinationImport] NO stock row found for combo ${combinationId}.`);
        failed++;
      }
    } catch (err) {
      console.error(`[combinationImport] Error processing stock for combo ${combinationId}`, err);
      failed++;
    }
  }

  return { success, failed };
};

export async function getCombinationInfo(
  productId: number,
  reference: string,
  valeur: string,
  rate: number,
  basePriceTtc: number
): Promise<CombinationMapEntry | null> {
  const prefix = `${reference}_`;
  const suffix = `_${valeur}`;
  
  // 1. Check map first
  for (const [key, value] of combinationMap.entries()) {
    if (key.startsWith(prefix) && key.endsWith(suffix)) {
      return value;
    }
  }

  // 2. Fallback to catalogLoader
  const info = await catalogLoader.getCombinationInfo(productId, valeur);
  if (info) {
    const priceHt = parseFloat(info.price || '0');
    const prixTtc = basePriceTtc + DomainPriceService.calculateTTC(priceHt, rate);
    const entry: CombinationMapEntry = { id: Number(info.id), prix_ttc: prixTtc };
    const comboKey = `${reference}_unknown_${valeur}`;
    combinationMap.set(comboKey, entry);
    return entry;
  }
  return null;
}
