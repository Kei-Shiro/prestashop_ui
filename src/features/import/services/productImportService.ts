import Papa from 'papaparse';
import apiService from '../../../shared/services/api-service';

export const taxRateMap = new Map<string, { id_tax_rules_group: number; rate_numeric: number }>();
export const categoryMap = new Map<string, number>();
export const productMap = new Map<string, { id_product: number; prix_ttc: number; id_tax_rules_group: number; rate: number }>();

export interface ProductCSVRow {
  date_availability: string;
  produit: string;
  reference: string;
  prix_ttc: string;
  Taxe: string;
  categorie: string;
  prix_achat: string;
}

export async function importProducts(csvFile: File): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse<ProductCSVRow>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const metaFields = (results.meta.fields || []).map(f => f.trim().replace(/^\uFEFF/, ''));
          const requiredCols = ['date_availability', 'produit', 'reference', 'prix_ttc', 'Taxe', 'categorie', 'prix_achat'];

          for (const col of requiredCols) {
            const found = metaFields.some(f => f.includes(col) || (col === 'produit' && f.includes('nom')));
            if (!found) {
              throw new Error(`VALIDATION_ERROR: Missing required column: ${col}`);
            }
          }

          const colMapping: Record<string, string> = {};
          for (const field of metaFields) {
            if (field.includes('date_availability')) colMapping['date_availability'] = field;
            else if (field.includes('produit') || field.includes('nom')) colMapping['produit'] = field;
            else if (field.includes('reference')) colMapping['reference'] = field;
            else if (field.includes('prix_ttc')) colMapping['prix_ttc'] = field;
            else if (field.includes('Taxe')) colMapping['Taxe'] = field;
            else if (field.includes('categorie')) colMapping['categorie'] = field;
            else if (field.includes('prix_achat')) colMapping['prix_achat'] = field;
          }

          const cleanRows = results.data.map((row: any) => ({
            date_availability: row[colMapping['date_availability']],
            produit: row[colMapping['produit']],
            reference: row[colMapping['reference']],
            prix_ttc: row[colMapping['prix_ttc']],
            Taxe: row[colMapping['Taxe']],
            categorie: row[colMapping['categorie']],
            prix_achat: row[colMapping['prix_achat']],
          } as ProductCSVRow));

          const uniqueTaxes = Array.from(new Set(cleanRows.map(r => r.Taxe).filter(Boolean)));
          const uniqueCategories = Array.from(new Set(cleanRows.map(r => r.categorie).filter(Boolean)));

          await processTaxes(uniqueTaxes);
          await processCategories(uniqueCategories);
          await processProducts(cleanRows);

          resolve();
        } catch (err) {
          console.error("Phase 0 Error:", err);
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

      // Vérifier si le groupe de taxe existe déjà
      let id_tax_rules_group: string | null = null;
      try {
        const existingGroup = await apiService.get<any>(
            `/tax_rule_groups?filter[name]=Group ${rateNum}%&display=full`
        );
        const found = existingGroup?.prestashop?.tax_rule_groups?.tax_rule_group;
        const first = Array.isArray(found) ? found[0] : found;
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
        const first = Array.isArray(found) ? found[0] : found;
        if (first?.id) {
          id_tax = first.id;
          console.log(`Tax already exists: Taxe ${rateNum}% → ${id_tax}`);
        }
      } catch (_) { /* pas trouvée, on crée */ }

      if (!id_tax) {
        const taxPayload = `<prestashop><tax><rate>${rateNum}</rate><active>1</active><name><language id="1">Taxe ${rateNum}%</language></name></tax></prestashop>`;
        const taxRes = await apiService.post<any>('/taxes', taxPayload);
        id_tax = taxRes?.prestashop?.tax?.id;
      }

      if (!id_tax_rules_group) {
        const groupPayload = `<prestashop><tax_rule_group><name>Group ${rateNum}%</name><active>1</active></tax_rule_group></prestashop>`;
        const groupRes = await apiService.post<any>('/tax_rule_groups', groupPayload);
        id_tax_rules_group = groupRes?.prestashop?.tax_rule_group?.id;
      }

      if (id_tax && id_tax_rules_group) {
        // id_country=8 (France, seul pays actif)
        const rulePayload = `<prestashop><tax_rule><id_tax_rules_group>${id_tax_rules_group}</id_tax_rules_group><id_tax>${id_tax}</id_tax><id_country>8</id_country></tax_rule></prestashop>`;
        try {
          await apiService.post<any>('/tax_rules', rulePayload);
        } catch (_) { /* règle déjà existante */ }
        taxRateMap.set(rawTax, { id_tax_rules_group: parseInt(id_tax_rules_group, 10), rate_numeric: rateNum });
        console.log(`Tax ready: ${rateNum}% → group ${id_tax_rules_group}`);
      }
    } catch (err) {
      console.error(`Error processing tax ${rawTax}:`, err);
    }
  }
}

async function processCategories(uniqueCategories: string[]) {
  for (const catName of uniqueCategories) {
    if (categoryMap.has(catName)) continue;

    try {
      // Vérifier si la catégorie existe déjà
      const filterUrl = `/categories?filter[name]=${encodeURIComponent(catName)}&display=full`;
      const getRes = await apiService.get<any>(filterUrl);
      const catNode = getRes?.prestashop?.categories?.category;
      let categoryId = null;
      if (Array.isArray(catNode)) {
        categoryId = catNode[0]?.id;
      } else if (catNode && typeof catNode === 'object') {
        categoryId = catNode.id;
      }

      if (categoryId) {
        categoryMap.set(catName, parseInt(categoryId, 10));
        console.log(`Category already exists: ${catName} → ${categoryId}`);
        continue;
      }

      // Générer un link_rewrite valide (URL friendly)
      const linkRewrite = catName
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const finalLinkRewrite = linkRewrite || 'categorie';

      const payload = `<prestashop>
  <category>
    <active>1</active>
    <id_parent>0</id_parent>
    <name>
      <language id="1"><![CDATA[${catName}]]></language>
    </name>
    <link_rewrite>
      <language id="1"><![CDATA[${finalLinkRewrite}]]></language>
    </link_rewrite>
  </category>
</prestashop>`;

      const createRes = await apiService.post<any>('/categories', payload);
      const newId = createRes?.prestashop?.category?.id;
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
  if (!dateStr) return '';
  let cleaned = dateStr.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      if (day.length === 2 && month.length === 2 && (year.length === 4 || year.length === 2)) {
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${fullYear}-${month}-${day}`;
      }
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  console.warn(`Invalid date format: ${dateStr}, using today`);
  return new Date().toISOString().split('T')[0];
}

async function processProducts(rows: ProductCSVRow[]) {
  for (const row of rows) {
    try {
      if (!row.reference || !row.produit) {
        console.error(`Missing reference or name, skipping row:`, row);
        continue;
      }

      // Vérifier si le produit existe déjà par référence
      if (productMap.has(row.reference)) {
        console.log(`Product already in map: ${row.reference}`);
        continue;
      }

      try {
        const existing = await apiService.get<any>(
            `/products?filter[reference]=${encodeURIComponent(row.reference)}&display=full`
        );
        const existingProduct = existing?.prestashop?.products?.product;
        const found = Array.isArray(existingProduct) ? existingProduct[0] : existingProduct;
        if (found?.id) {
          const taxData = taxRateMap.get(row.Taxe);
          const cleanPrixTtc = parseFloat((row.prix_ttc || '0').replace(',', '.'));
          productMap.set(row.reference, {
            id_product: parseInt(found.id, 10),
            prix_ttc: cleanPrixTtc,
            id_tax_rules_group: taxData?.id_tax_rules_group ?? 0,
            rate: taxData?.rate_numeric ?? 0,
          });
          console.log(`Product already exists: ${row.reference} → ${found.id}`);
          continue;
        }
      } catch (_) { /* pas trouvé, on crée */ }

      const cleanPrixTtc = parseFloat((row.prix_ttc || '0').replace(',', '.'));
      const cleanPrixAchat = parseFloat((row.prix_achat || '0').replace(',', '.'));
      if (isNaN(cleanPrixTtc) || isNaN(cleanPrixAchat)) {
        console.error(`Invalid price format for ${row.reference}`);
        continue;
      }

      const taxData = taxRateMap.get(row.Taxe);
      if (!taxData) {
        console.error(`Tax missing for ${row.Taxe}, skipping ${row.reference}`);
        continue;
      }

      const id_category = categoryMap.get(row.categorie);
      if (!id_category) {
        console.error(`Category missing for ${row.categorie}, skipping ${row.reference}`);
        continue;
      }

      const priceHt = cleanPrixTtc / (1 + taxData.rate_numeric / 100);
      const priceHtStr = priceHt.toFixed(6);
      const availableDate = convertDate(row.date_availability);

      const payload = `<prestashop>
  <product>
    <reference><![CDATA[${row.reference}]]></reference>
    <name><language id="1"><![CDATA[${row.produit}]]></language></name>
    <price>${priceHtStr}</price>
    <wholesale_price>${cleanPrixAchat}</wholesale_price>
    <id_tax_rules_group>${taxData.id_tax_rules_group}</id_tax_rules_group>
    <available_date>${availableDate}</available_date>
    <active>1</active>
    <available_for_order>1</available_for_order>
    <associations>
      <categories>
        <category><id>${id_category}</id></category>
      </categories>
    </associations>
  </product>
</prestashop>`;

      const res = await apiService.post<any>('/products', payload);
      const id_product = res?.prestashop?.product?.id;
      if (id_product) {
        productMap.set(row.reference, {
          id_product: parseInt(id_product, 10),
          prix_ttc: cleanPrixTtc,
          id_tax_rules_group: taxData.id_tax_rules_group,
          rate: taxData.rate_numeric,
        });
        console.log(`Product created: ${row.reference} → ${id_product}`);

        // Le stock_available est créé automatiquement par PrestaShop
        console.log(`Product created successfully: ${row.reference} → ${id_product}`);

      } else {
        console.error(`Failed to create product ${row.reference}`);
      }
    } catch (err) {
      console.error(`Error processing product ${row.reference}:`, err);
    }
  }
}