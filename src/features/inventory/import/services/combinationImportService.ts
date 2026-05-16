import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService";
import type { StockCSVRow, CombinationMapEntry, ProductOption, ProductOptionValue, CombinationPost, StockAvailablePut, StockAvailableGet, LValue } from "@shared/types/import";
import { Serializer } from "@shared/utils/serializer";
import { extractIdValue } from "@shared/utils/extractIdValue";

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
  // Repartir de zéro à chaque import (les maps sont des singletons de module).
  attributeMap.clear();
  attributeValueMap.clear();
  combinationMap.clear();
  const text = await csvFile.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const metaFields = (results.meta.fields || []).map(f => f.trim().replace(/^\uFEFF/, ''));

          const colMapping: Record<string, string> = {
            reference:      metaFields[0],
            specificite:    metaFields[1],
            valeur:         metaFields[2],
            stock_initial:  metaFields[3],
            prix_vente_ttc: metaFields[4],
          };

          for (const field of metaFields) {
            const lowerField = field.toLowerCase();
            if (lowerField.includes("ref") || lowerField.includes("réf")) colMapping["reference"] = field;
            else if (lowerField.includes("cificit") || lowerField.includes("spec") || lowerField.includes("spéc")) colMapping["specificite"] = field;
            else if (lowerField.includes("valeur") || lowerField.includes("val") || lowerField.includes("karazany")) colMapping["valeur"] = field;
            else if (lowerField.includes("stock") || lowerField.includes("qte") || lowerField.includes("quant")) colMapping["stock_initial"] = field;
            else if (lowerField.includes("vente") || lowerField.includes("ttc") || lowerField.includes("prix")) colMapping["prix_vente_ttc"] = field;
          }

          console.log("Col Mapping:", colMapping);

          const rows = results.data.map((row: any) => {
            const normalizedRow: any = {};
            const originalFieldForReference   = results.meta.fields?.find(f => f.trim().replace(/^\uFEFF/, '') === colMapping["reference"]);
            const originalFieldForSpecificite = results.meta.fields?.find(f => f.trim().replace(/^\uFEFF/, '') === colMapping["specificite"]);
            const originalFieldForValeur      = results.meta.fields?.find(f => f.trim().replace(/^\uFEFF/, '') === colMapping["valeur"]);
            const originalFieldForStock       = results.meta.fields?.find(f => f.trim().replace(/^\uFEFF/, '') === colMapping["stock_initial"]);
            const originalFieldForPrix        = results.meta.fields?.find(f => f.trim().replace(/^\uFEFF/, '') === colMapping["prix_vente_ttc"]);

            normalizedRow.reference      = originalFieldForReference   ? row[originalFieldForReference]?.trim()   : undefined;
            normalizedRow.specificite    = originalFieldForSpecificite ? row[originalFieldForSpecificite]?.trim() : undefined;
            normalizedRow.valeur         = originalFieldForValeur      ? row[originalFieldForValeur]?.trim()      : undefined;
            normalizedRow.stock_initial  = originalFieldForStock       ? row[originalFieldForStock]?.trim()       : undefined;
            normalizedRow.prix_vente_ttc = originalFieldForPrix        ? row[originalFieldForPrix]?.trim()        : undefined;

            return normalizedRow as StockCSVRow;
          });

          console.log("Parsed clean rows:", rows);
          await processCombinationsAndStocks(rows);
          resolve();
        } catch (err) {
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
        const allSimpleStocks: StockAvailableGet[] = Array.isArray(rawSimple) ? rawSimple : (rawSimple ? [rawSimple] : []);
        const simpleStock = allSimpleStocks.find(
            (s: any) => !s.id_product_attribute || extractIdValue(s.id_product_attribute) === '0'
        ) ?? allSimpleStocks[0];

        const stockId = simpleStock?.id ?? null;
        console.log(`Stock simple product ${productId}: stockId=${stockId}, entries=${allSimpleStocks.length}`);

        if (stockId) {
          const quantity = stock_initial ? parseInt(stock_initial, 10) : 0;
          const stockData: StockAvailablePut = {
            id: Number(extractIdValue(stockId)),
            id_product: productId,
            id_product_attribute: 0,
            id_shop: Number(extractIdValue(simpleStock.id_shop) || 1),
            id_shop_group: Number(extractIdValue(simpleStock.id_shop_group) || 0),
            quantity: quantity,
            depends_on_stock: 0,
            out_of_stock: 2,
            location: simpleStock.location || ''
          };
          await apiService.put(`/stock_availables/${extractIdValue(stockId)}`, { stock_available: stockData });
          console.log(`Stock updated for simple product ${productId}: qty=${quantity}`);
        } else {
          console.warn(`No stock_available entry found for simple product ${productId}`);
        }
      } catch (err) {
        console.error(`Error updating stock for simple product ${reference}`, err);
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
      // Vérifier si l'attribut existe déjà dans PS
      try {
        const existing = await apiService.get<any>(
            `/product_options?filter[name]=${encodeURIComponent(specificite)}&display=full`
        );
        const existingOption = existing?.prestashop?.product_options?.product_option;
        const found = Array.isArray(existingOption) ? existingOption[0] : existingOption;
        if (found?.id) {
          const id = Number(extractIdValue(found.id));
          attributeMap.set(specificite, id);
          if (!attributeValueMap.has(specificite)) attributeValueMap.set(specificite, new Map());
          console.log(`Attribute already exists: ${specificite} → ${id}`);
        }
      } catch (_) { /* pas trouvé, on crée */ }

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
      // Vérifier si la valeur existe déjà dans PS
      try {
        const existing = await apiService.get<any>(
            `/product_option_values?filter[id_attribute_group]=${attributeId}&filter[name]=${encodeURIComponent(valeur)}&display=full`
        );
        const existingVal = existing?.prestashop?.product_option_values?.product_option_value;
        const found = Array.isArray(existingVal) ? existingVal[0] : existingVal;
        if (found?.id) {
          const id = Number(extractIdValue(found.id));
          valMap.set(valeur, id);
          console.log(`Attribute value already exists: ${valeur} → ${id}`);
        }
      } catch (_) { /* pas trouvée, on crée */ }

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
    const combinationKey = `${reference}-${valeur}`;
    let combinationId = combinationMap.get(combinationKey)?.id;

    if (!combinationId) {
      // Vérifier si la combinaison existe déjà dans PS par référence
      try {
        const existing = await apiService.get<any>(
            `/combinations?filter[reference]=${encodeURIComponent(`${reference}-${valeur}`)}&display=full`
        );
        const existingCombo = existing?.prestashop?.combinations?.combination;
        const found = Array.isArray(existingCombo) ? existingCombo[0] : existingCombo;
        if (found?.id) {
          combinationId = Number(extractIdValue(found.id));
          combinationMap.set(combinationKey, { id: combinationId, prix_ttc: productData.prix_ttc });
          console.log(`Combination already exists: ${combinationKey} → ${combinationId}`);
        }
      } catch (_) { /* pas trouvée, on crée */ }

      if (!combinationId) {
        let impactHt = 0;
        let prixVenteTtc = productData.prix_ttc;
        if (row.prix_vente_ttc) {
          const parsed = parseFloat(row.prix_vente_ttc.replace(",", "."));
          if (!isNaN(parsed)) {
            prixVenteTtc = parsed;
            impactHt = (prixVenteTtc - productData.prix_ttc) / (1 + productData.rate / 100);
          }
        }

        const combinationData: CombinationPost = {
          id_product: productId,
          reference: `${reference}-${valeur}`,
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
            combinationMap.set(combinationKey, { id: combinationId, prix_ttc: prixVenteTtc });
            console.log(`Combination created: ${combinationKey} → ${combinationId}`);
          }
        } catch (err) {
          console.error(`Error creating combination for ${combinationKey}`, err);
          continue;
        }
      }
    }

    if (!combinationId) continue;

    // ── Stock déclinaison ──
    try {
      const stockGetRes = await apiService.get<any>(
          `/stock_availables?filter[id_product_attribute]=${combinationId}&display=full`,
      );

      const rawCombo = stockGetRes?.prestashop?.stock_availables?.stock_available;
      const allComboStocks: StockAvailableGet[] = Array.isArray(rawCombo) ? rawCombo : (rawCombo ? [rawCombo] : []);
      const quantity = stock_initial ? parseInt(stock_initial, 10) : 0;

      console.log(`Stock combo ${combinationId}: entries=${allComboStocks.length}, qty=${quantity}`);

      if (allComboStocks.length > 0) {
        // Ligne existante → PUT
        const stockRecord = allComboStocks[0];
        const stockId = extractIdValue(stockRecord.id);
        const stockData: StockAvailablePut = {
          id: Number(stockId),
          id_product: productId,
          id_product_attribute: combinationId,
          id_shop: Number(extractIdValue(stockRecord.id_shop) || 1),
          id_shop_group: Number(extractIdValue(stockRecord.id_shop_group) || 0),
          quantity: quantity,
          depends_on_stock: 0,
          out_of_stock: 2,
          location: stockRecord.location || ''
        };
        await apiService.put(`/stock_availables/${stockId}`, { stock_available: stockData });
        console.log(`Stock updated (PUT) for combination ${combinationId}: qty=${quantity}`);
      } else {
        console.warn(`No stock_available entry found for combination ${combinationId}`);
      }
    } catch (err) {
      console.error(`Error updating stock for combination ${combinationId}`, err);
    }
  }
};
