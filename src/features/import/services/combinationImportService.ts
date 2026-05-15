import Papa from "papaparse";
import apiService from "../../../shared/services/api-service";
import { productMap } from "./productImportService";

export const attributeMap = new Map<string, number>();
export const attributeValueMap = new Map<string, Map<string, number>>();
export const combinationMap = new Map<string, { id: number; prix_ttc: number }>();

export interface StockCSVRow {
  reference: string;
  specificite: string;
  valeur: string;
  stock_initial: string;
  prix_vente_ttc: string;
}

export const importCombinationsAndStocks = async (csvFile: File): Promise<void> => {
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
        const stockGet = await apiService.get<any>(
            `/stock_availables?filter[id_product]=${productId}&display=full`,
        );

        const rawSimple = stockGet?.prestashop?.stock_availables?.stock_available;
        const allSimpleStocks = Array.isArray(rawSimple) ? rawSimple : (rawSimple ? [rawSimple] : []);
        const simpleStock = allSimpleStocks.find(
            (s: any) => !s.id_product_attribute || s.id_product_attribute === '0' || parseInt(s.id_product_attribute, 10) === 0
        ) ?? allSimpleStocks[0];

        const stockId = simpleStock?.id ?? null;
        console.log(`Stock simple product ${productId}: stockId=${stockId}, entries=${allSimpleStocks.length}`);

        if (stockId) {
          const quantity = stock_initial ? parseInt(stock_initial, 10) : 0;
          const stockPutXml = `<prestashop>
            <stock_available>
              <id>${stockId}</id>
              <id_product>${productId}</id_product>
              <id_product_attribute>0</id_product_attribute>
              <id_shop>${simpleStock.id_shop || 1}</id_shop>
              <id_shop_group>${simpleStock.id_shop_group || 0}</id_shop_group>
              <quantity>${quantity}</quantity>
              <depends_on_stock>0</depends_on_stock>
              <out_of_stock>2</out_of_stock>
            </stock_available>
          </prestashop>`;
          await apiService.put(`/stock_availables/${stockId}`, stockPutXml);
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
          attributeMap.set(specificite, parseInt(found.id, 10));
          if (!attributeValueMap.has(specificite)) attributeValueMap.set(specificite, new Map());
          console.log(`Attribute already exists: ${specificite} → ${found.id}`);
        }
      } catch (_) { /* pas trouvé, on crée */ }

      if (!attributeMap.has(specificite)) {
        const optionXml = `<prestashop><product_option><name><language id="1"><![CDATA[${specificite}]]></language></name><public_name><language id="1"><![CDATA[${specificite}]]></language></public_name><group_type>select</group_type><is_color_group>0</is_color_group></product_option></prestashop>`;
        try {
          const response = await apiService.post<any>("/product_options", optionXml);
          const idMatch = response?.prestashop?.product_option?.id;
          if (idMatch) {
            attributeMap.set(specificite, parseInt(idMatch, 10));
            attributeValueMap.set(specificite, new Map<string, number>());
            console.log(`Attribute created: ${specificite} → ${idMatch}`);
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
          valMap.set(valeur, parseInt(found.id, 10));
          console.log(`Attribute value already exists: ${valeur} → ${found.id}`);
        }
      } catch (_) { /* pas trouvée, on crée */ }

      if (!valMap.has(valeur)) {
        const optionValueXml = `<prestashop><product_option_value><id_attribute_group>${attributeId}</id_attribute_group><name><language id="1"><![CDATA[${valeur}]]></language></name></product_option_value></prestashop>`;
        try {
          const response = await apiService.post<any>("/product_option_values", optionValueXml);
          const idMatch = response?.prestashop?.product_option_value?.id;
          if (idMatch) {
            valMap.set(valeur, parseInt(idMatch, 10));
            console.log(`Attribute value created: ${valeur} → ${idMatch}`);
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
          combinationId = parseInt(found.id, 10);
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

        const combinationXml = `<prestashop><combination>
    <id_product>${productId}</id_product>
    <reference><![CDATA[${reference}-${valeur}]]></reference>
    <price>${impactHt.toFixed(6)}</price>
    <minimal_quantity>1</minimal_quantity>
    <associations>
      <product_option_values>
        <product_option_value><id>${attributeValueId}</id></product_option_value>
      </product_option_values>
    </associations>
    </combination></prestashop>`;

        try {
          const response = await apiService.post<any>("/combinations", combinationXml);
          const idMatch = response?.prestashop?.combination?.id;
          if (idMatch) {
            combinationId = parseInt(idMatch, 10);
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
      const stockGet = await apiService.get<any>(
          `/stock_availables?filter[id_product_attribute]=${combinationId}&display=full`,
      );

      const rawCombo = stockGet?.prestashop?.stock_availables?.stock_available;
      const allComboStocks = Array.isArray(rawCombo) ? rawCombo : (rawCombo ? [rawCombo] : []);
      const quantity = stock_initial ? parseInt(stock_initial, 10) : 0;

      console.log(`Stock combo ${combinationId}: entries=${allComboStocks.length}, qty=${quantity}`);

      if (allComboStocks.length > 0) {
        // Ligne existante → PUT
        const stockRecord = allComboStocks[0];
        const stockId = stockRecord.id;
        const stockPutXml = `<prestashop>
          <stock_available>
            <id>${stockId}</id>
            <id_product>${productId}</id_product>
            <id_product_attribute>${combinationId}</id_product_attribute>
            <id_shop>${stockRecord.id_shop || 1}</id_shop>
            <id_shop_group>${stockRecord.id_shop_group || 0}</id_shop_group>
            <quantity>${quantity}</quantity>
            <depends_on_stock>0</depends_on_stock>
            <out_of_stock>2</out_of_stock>
          </stock_available>
        </prestashop>`;
        await apiService.put(`/stock_availables/${stockId}`, stockPutXml);
        console.log(`Stock updated (PUT) for combination ${combinationId}: qty=${quantity}`);
      } else {
        console.warn(`No stock_available entry found for combination ${combinationId}`);
      }
    } catch (err) {
      console.error(`Error updating stock for combination ${combinationId}`, err);
    }
  }
};