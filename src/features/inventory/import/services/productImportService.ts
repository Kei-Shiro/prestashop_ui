import Papa from 'papaparse';
import apiService from '@shared/api/api-service';
import type { ProductCSVRow, ProductMapEntry } from '@shared/types/import';
import type { LangField } from '@shared/types/common';
import type { TaxCreatePayload } from '@shared/types/tax';
import type { TaxRuleGroupCreatePayload } from '@shared/types/tax-rule-group';
import type { TaxRuleCreatePayload } from '@shared/types/tax-rule';
import type { CategoryCreatePayload } from '@shared/types/category';
import type { ProductCreatePayload } from '@shared/types/product';
import { ImportValidator } from '@shared/utils/import-validator';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { toLValue } from '@shared/utils/extractLanguageValue';
import { DomainPriceService } from '@shared/utils/priceUtils';

export const taxRateMap = new Map<string, { id_tax_rules_group: number; rate_numeric: number }>();
export const categoryMap = new Map<string, number>();
export const productMap = new Map<string, ProductMapEntry>();


export async function importProducts(csvFile: File): Promise<void> {
  taxRateMap.clear();
  categoryMap.clear();
  productMap.clear();
  
  const text = await csvFile.text();
  return new Promise((resolve, reject) => {
    Papa.parse<any>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const metaFields = (results.meta.fields || []).map(f => f.trim().replace(/^\uFEFF/, ''));
          const requiredCols = ['date_availability_produit', 'nom', 'reference', 'prix_ttc', 'Taxe', 'categorie', 'prix_achat'];

          // 1. Validation des colonnes (insensible à la casse)
          const colMap = ImportValidator.validateColumns(metaFields, requiredCols);

          const cleanRows = results.data.map((row: any) => {
            const dateVal = row[colMap['date_availability_produit']];
            const prixTtcVal = row[colMap['prix_ttc']];
            const prixAchatVal = row[colMap['prix_achat']];

            // 2. Validation stricte
            ImportValidator.validateDateFormat(dateVal, 'date_availability_produit');
            ImportValidator.validatePositiveAmount(prixTtcVal, 'prix_ttc');
            ImportValidator.validatePositiveAmount(prixAchatVal, 'prix_achat');

            return {
              date_availability: (dateVal || "").trim(),
              produit: (row[colMap['nom']] || "").trim(),
              reference: (row[colMap['reference']] || "").trim(),
              prix_ttc: (prixTtcVal || "").trim(),
              Taxe: (row[colMap['Taxe']] || "").trim(),
              categorie: (row[colMap['categorie']] || "").trim(),
              prix_achat: (prixAchatVal || "").trim(),
            } as ProductCSVRow;
          });

          const uniqueTaxes = Array.from(new Set(cleanRows.map(r => r.Taxe).filter(Boolean)));
          const uniqueCategories = Array.from(new Set(cleanRows.map(r => r.categorie).filter(Boolean)));

          await processTaxes(uniqueTaxes);
          await processCategories(uniqueCategories);
          await processProducts(cleanRows);

          resolve();
        } catch (err) {
          console.error("Product import failed validation:", err);
          reject(err);
        }
      },
      error: (error: any) => reject(error),
    });
  });
}

async function processTaxes(uniqueTaxes: string[]) {
  for (const rawTax of uniqueTaxes) {
    if (taxRateMap.has(rawTax)) continue;

    try {
      const cleanTax = rawTax.replace('%', '').replace(',', '.').trim();
      const rateNum = parseFloat(cleanTax);
      if (isNaN(rateNum)) {
        console.error(`Invalid tax rate: ${rawTax}`);
        continue;
      }

      let id_tax_rules_group: string | null = null;
      try {
        const existingGroup = await apiService.get<any>(
            `/tax_rule_groups?filter[name]=Group ${rateNum}%&display=full`
        );
        const found = existingGroup?.prestashop?.tax_rule_groups?.tax_rule_group;
        const first = ensureArray(found)[0];
        if (first?.id) {
          id_tax_rules_group = first.id;
          console.log(`Tax group already exists: Group ${rateNum}% → ${id_tax_rules_group}`);
        }
      } catch (_) { /* pas trouvé, on crée */ }

      // Vérifier si la taxe existe déjà
      let id_tax: string | null = null;
      try {
        const existingTax = await apiService.get<any>(
            `/taxes?filter[name]=Taxe ${rateNum}%&display=full`
        );
        const found = existingTax?.prestashop?.taxes?.tax;
        const first = ensureArray(found)[0];
        if (first?.id) {
          id_tax = first.id;
          console.log(`Tax already exists: Taxe ${rateNum}% → ${id_tax}`);
        }
      } catch (_) { /* pas trouvée, on crée */ }

      if (!id_tax) {
        const taxData: TaxCreatePayload = {
          rate: rateNum,
          active: 1,
          name: toLValue(`Taxe ${rateNum}%`)
        };
        const taxRes = await apiService.post<any>('/taxes', { tax: taxData });
        id_tax = taxRes?.prestashop?.tax?.id;
      }

      if (!id_tax_rules_group) {
        const groupData: TaxRuleGroupCreatePayload = {
          name: `Group ${rateNum}%`,
          active: 1
        };
        const groupRes = await apiService.post<any>('/tax_rule_groups', { tax_rule_group: groupData });
        id_tax_rules_group = groupRes?.prestashop?.tax_rule_group?.id;
      }

      if (id_tax && id_tax_rules_group) {
        // id_country=8 (France, seul pays actif)
        const ruleData: TaxRuleCreatePayload = {
          id_tax_rules_group: parseInt(id_tax_rules_group, 10),
          id_tax: parseInt(id_tax, 10),
          id_country: 8
        };
        try {
          await apiService.post<any>('/tax_rules', { tax_rule: ruleData });
        } catch (_) { /* règle déjà existante */ }
        taxRateMap.set(rawTax, { id_tax_rules_group: parseInt(id_tax_rules_group, 10), rate_numeric: rateNum });
        console.log(`Tax ready: ${rateNum}% → group ${id_tax_rules_group}`);
      }
    } catch (err) {
      console.error(`API_ERROR: Error processing tax ${rawTax}:`, err);
    }
  }
}

async function processCategories(uniqueCategories: string[]) {
  for (const catName of uniqueCategories) {
    if (categoryMap.has(catName)) continue;

    try {
      // Rechercher par nom
      const existing = await apiService.get<any>(
          `/categories?filter[name]=${encodeURIComponent(catName)}&display=full`
      );
      const found = existing?.prestashop?.categories?.category;
      const first = ensureArray(found)[0];
      if (first?.id) {
        categoryMap.set(catName, parseInt(first.id, 10));
        console.log(`Category already exists: ${catName} → ${first.id}`);
        continue;
      }

      const catData: CategoryCreatePayload = {
        active: 1,
        id_parent: 2, // Home
        name: toLValue(catName),
        link_rewrite: toLValue(catName.toLowerCase().replace(/[^a-z0-9]/g, '-'))
      };

      const res = await apiService.post<any>('/categories', { category: catData });
      const newId = res?.prestashop?.category?.id;
      if (newId) {
        categoryMap.set(catName, parseInt(newId, 10));
        console.log(`Category created: ${catName} → ${newId}`);
      } else {
        console.error(`Failed to create category ${catName}`);
      }
    } catch (err) {
      console.error(`API_ERROR: Error processing category ${catName}:`, err);
    }
  }
}

function convertDate(dateStr: string): string {
  return ImportValidator.validateDateFormat(dateStr, 'date_availability_produit');
}

async function processProducts(rows: ProductCSVRow[]) {
  for (const row of rows) {
    try {
      if (!row.reference || !row.produit) {
        throw new Error(`Missing reference or name in row: ${JSON.stringify(row)}`);
      }

      if (productMap.has(row.reference)) {
        continue;
      }

      try {
        const existing = await apiService.get<any>(
            `/products?filter[reference]=${encodeURIComponent(row.reference)}&display=full`
        );
        const existingProduct = existing?.prestashop?.products?.product;
        const found = ensureArray(existingProduct)[0];
        if (found?.id) {
          const taxData = taxRateMap.get(row.Taxe);
          const cleanPrixTtc = ImportValidator.validatePositiveAmount(row.prix_ttc, 'prix_ttc');
          productMap.set(row.reference, {
            id_product: parseInt(found.id, 10),
            prix_ttc: cleanPrixTtc,
            id_tax_rules_group: parseInt(extractIdValue(found.id_tax_rules_group) || String(taxData?.id_tax_rules_group || 1), 10),
            rate: taxData?.rate_numeric || 20,
            available_date: found.available_date || ''
          });
          console.log(`Product mapped: ${row.reference} → ${found.id}`);
          continue;
        }
      } catch (_) { /* ignore */ }

      const taxData = taxRateMap.get(row.Taxe);
      const categoryId = categoryMap.get(row.categorie) || 2;
      const cleanPrixTtc = ImportValidator.validatePositiveAmount(row.prix_ttc, 'prix_ttc');
      const cleanPrixAchat = ImportValidator.validatePositiveAmount(row.prix_achat, 'prix_achat');
      const rate = taxData?.rate_numeric || 20;
      const priceHt = DomainPriceService.calculateHT(cleanPrixTtc, rate);

      const productData: ProductCreatePayload = {
        name: toLValue(row.produit),
        reference: row.reference,
        price: parseFloat(priceHt.toFixed(6)),
        wholesale_price: cleanPrixAchat,
        id_tax_rules_group: taxData?.id_tax_rules_group || 1,
        id_category_default: categoryId,
        link_rewrite: toLValue(row.produit.toLowerCase().replace(/[^a-z0-9]/g, '-')),
        active: 1,
        show_price: 1,
        available_for_order: 1,
        state: 1,
        visibility: 'both',
        minimal_quantity: 1,
        product_type: 'standard',
        condition: 'new',
        available_date: convertDate(row.date_availability),
        associations: {
          categories: {
            category: [{ id: 2 }, { id: categoryId }]
          }
        }
      };

      const res = await apiService.post<any>('/products', { product: productData });
      const newId = res?.prestashop?.product?.id;
      if (newId) {
        productMap.set(row.reference, {
          id_product: parseInt(newId, 10),
          prix_ttc: cleanPrixTtc,
          id_tax_rules_group: productData.id_tax_rules_group,
          rate: rate,
          available_date: productData.available_date
        });
        console.log(`Product created: ${row.produit} → ${newId}`);
      }
    } catch (err) {
      console.error(`API_ERROR: Error processing product ${row.reference}:`, err);
    }
  }
}
