/**
 * Import Orchestrator Service
 * Coordonne l'import complet : parsing, détection, mapping, dépendances, images.
 *
 * Ordre d'import :
 * 1. Catégories (extraction depuis produits + création)
 * 2. Produits (import CSV + récupération IDs)
 * 3. Images (upload depuis ZIP → association par référence)
 * 4. Combinaisons (vérification parent + import)
 * 5. Clients (skip si email existe)
 * 6. Adresses (création pour chaque client)
 * 7. Commandes (parsing panier, cart → order)
 */
import type {
  ImportFile,
  ImportProgress,
  ImportDetail,
  ImportError,
  ColumnMapping,
  CategoryInfo,
  ExtractedImage,
  EntityType,
} from '@features/import/types/import.types';
import { parseCsvString } from './csv-parser.service';
import { extractZipComplete } from './zip-extractor.service';
import { extractCategoriesFromProducts, buildCategoryIdMap } from './category-extractor';
import { mapRow, type ColumnMapperContext } from './column-mapper.service';
import { getColumnMappings, getFixedValues, loadMappingConfig } from './mapping-loader.service';
import {
  buildProductXml,
  buildCategoryXml,
  buildCombinationXml,
  buildCustomerXml,
  buildAddressXml,
  buildCartXml,
  buildOrderXml,
buildStockAvailableXml,
  buildTaxRulesGroupXml,
  buildTaxXml,
  buildTaxRuleXml,
  buildProductOptionXml,
  buildProductOptionValueXml,
} from './prestashop-adapter';
import { uploadProductImages } from './image-uploader.service';
import { parseCartString } from './cart-parser';
import { resolveImportOrder, type ImportPhase } from './dependency-resolver';
import { slugify } from '@features/import/utils/slugify';
import apiService from '@shared/services/api-service';

// ──────────────────────────── Types internes ────────────────────────────
interface OrchestratedFile {
  entity: EntityType | 'unknown';
  rows: Record<string, string>[];
  fileName: string;
  overrideEndpoint?: string;
}

export interface OrchestratorOptions {
  onProgress?: (progress: ImportProgress) => void;
}

interface TaxCacheInfo {
  id_tax_rules_group: number;
  rate: number;
}
const taxCache = new Map<string, TaxCacheInfo>();

interface ProductCacheInfo {
  id_product: number;
  prix_ttc: number;
  rate: number;
}

const combReferenceCache = new Map<string, number>();

function parseTaxRate(taxString: string): number {
    if (!taxString) return 0;
    const clean = taxString.replace('%', '').replace(',', '.').trim();
    const rate = parseFloat(clean);
    return isNaN(rate) ? 0 : rate;
}

// ──────────────────────────── Helpers API ────────────────────────────

/**
 * Vérifie si un client existe déjà par son email, retourne l'ID ou null
 */
async function findCustomerByEmail(email: string): Promise<number | null> {
  try {
    const response = await apiService.get<any>(
      `/customers?filter[email]=${encodeURIComponent(email)}&display=[id]`
    );
    const customers = response?.prestashop?.customers?.customer
      || response?.customers?.customer;
    if (!customers) return null;
    const list = Array.isArray(customers) ? customers : [customers];
    if (list.length > 0) {
      const id = list[0].id;
      return typeof id === 'object' ? parseInt(id._, 10) : parseInt(id, 10);
    }
  } catch {
    // silencieux
  }
  return null;
}

/**
 * Recherche un produit par référence et retourne son ID
 */
async function findProductByReference(reference: string): Promise<number | null> {
  try {
    const response = await apiService.get<any>(
      `/products?filter[reference]=${encodeURIComponent(reference)}&display=[id]`
    );
    const products = response?.prestashop?.products?.product
      || response?.products?.product;
    if (!products) return null;
    const list = Array.isArray(products) ? products : [products];
    if (list.length > 0) {
      const id = list[0].id;
      return typeof id === 'object' ? parseInt(id._, 10) : parseInt(id, 10);
    }
  } catch {
    // silencieux
  }
  return null;
}

/**
 * Recherche une catégorie par nom et retourne son ID
 */
async function fetchCategoryIdByName(name: string): Promise<number | null> {
  try {
    const response = await apiService.get<any>('/categories', {
      params: {
        'filter[name]': name,
        display: '[id]',
      },
    });
    const cats = response?.categories?.category
      || response?.prestashop?.categories?.category;
    if (cats) {
      const list = Array.isArray(cats) ? cats : [cats];
      if (list.length > 0) {
        const id = list[0].id;
        return typeof id === 'object' ? parseInt(id._, 10) : parseInt(id, 10);
      }
    }
  } catch {
    // silencieux
  }
  return null;
}

/**
 * Parse l'état de commande textuel → ID PrestaShop
 */
function parseOrderState(state: string): string {
  const stateMap: Record<string, string> = {
    'en attente': '1',
    'paiement accepté': '2',
    'en cours de préparation': '3',
    'expédié': '4',
    'livré': '5',
    'annulé': '6',
    'remboursé': '7',
    'erreur de paiement': '8',
    'pending': '1',
    'paid': '2',
    'processing': '3',
    'shipped': '4',
    'delivered': '5',
    'cancelled': '6',
    'refunded': '7',
  };
  const normalized = state.toLowerCase().trim();
  return stateMap[normalized] || state || '1';
}

// ──────────────────────────── Fonction principale ────────────────────────────
export async function orchestrateImport(
    files: ImportFile[],
    options: OrchestratorOptions = {}
): Promise<{ success: boolean; details: ImportDetail[] }> {
  const details: ImportDetail[] = [];
  let allSuccess = true;
  let totalSteps = 7;
  let currentStep = 0;

  const reportProgress = (phase: ImportProgress['phase'], stepLabel: string) => {
    currentStep++;
    if (options.onProgress) {
      options.onProgress({
        phase,
        currentStep: stepLabel,
        totalSteps,
        currentStepIndex: currentStep,
        percentage: Math.min(Math.round((currentStep / totalSteps) * 100), 100),
        details: [...details],
      });
    }
  };

  const updateDetail = (detail: ImportDetail) => {
    if (options.onProgress) {
      options.onProgress({
        phase: 'importing',
        currentStep: `Import ${detail.entity}`,
        totalSteps,
        currentStepIndex: currentStep,
        percentage: Math.min(Math.round((currentStep / totalSteps) * 100), 100),
        details: [...details],
      });
    }
  };

  try {
    // ═══════════════════ PHASE 1 : Parsing & Extraction ═══════════════════
    reportProgress('parsing', 'Analyse des fichiers');

    const parsedFiles: OrchestratedFile[] = [];
    const allImages: ExtractedImage[] = [];

    for (const importFile of files) {
      if (importFile.type === 'zip') {
        // Extraction complète (CSV + images)
        const extracted = await extractZipComplete(importFile.file);

        // CSV dans le ZIP
        for (const csvFile of extracted.csvFiles) {
          const rows = parseCsvString(csvFile.content);
          const entity = detectEntityFromRows(rows);
          parsedFiles.push({
            entity: importFile.overrideEndpoint
              ? (importFile.overrideEndpoint as EntityType)
              : entity,
            rows,
            fileName: csvFile.filename.replace(/^.*[\\/]/, ''),
            overrideEndpoint: importFile.overrideEndpoint,
          });
        }

        // Images dans le ZIP
        allImages.push(...extracted.imageFiles);
      } else {
        // CSV simple
        const text = await importFile.file.text();
        const rows = parseCsvString(text);
        const entity = importFile.overrideEndpoint
          ? (importFile.overrideEndpoint as EntityType)
          : detectEntityFromRows(rows);
        parsedFiles.push({
          entity,
          rows,
          fileName: importFile.name,
          overrideEndpoint: importFile.overrideEndpoint,
        });
      }
    }

    const entityTypes = parsedFiles.map(f => f.entity);
    console.log('Entités détectées :', entityTypes);
    console.log('Images extraites :', allImages.length);

    // Calculer le nombre total de steps basé sur ce qu'on a
    const hasProducts = parsedFiles.some(f => f.entity === 'product');
    const hasCombinations = parsedFiles.some(f => f.entity === 'combination');
    const hasCustomers = parsedFiles.some(f => f.entity === 'customer');
    const hasOrders = parsedFiles.some(f => f.entity === 'order');
    const hasImages = allImages.length > 0;

    totalSteps = 1; // parsing
    if (hasProducts) totalSteps += 2; // categories + products
    if (hasImages) totalSteps += 1; // images
    if (hasCombinations) totalSteps += 1;
    if (hasCustomers) totalSteps += 1;
    if (hasOrders) totalSteps += 2; // addresses + orders

    // ═══════════════════ PHASE 2 : Catégories ═══════════════════
    const productFiles = parsedFiles.filter(f => f.entity === 'product');
    let categoryMap: Record<string, number> = {};

    if (productFiles.length > 0) {
      reportProgress('mapping', 'Création des catégories');

      const allProductRows = productFiles.flatMap(f => f.rows);
      const categories = extractCategoriesFromProducts(allProductRows, 'categorie');

      if (categories.length > 0) {
        const catDetail: ImportDetail = {
          entity: 'category',
          status: 'in_progress',
          imported: 0,
          failed: 0,
          total: categories.length,
          errors: [],
        };
        details.push(catDetail);

        const createdCategories = await importCategories(categories);
        categoryMap = buildCategoryIdMap(createdCategories);

        catDetail.imported = createdCategories.filter(c => (c.id ?? 0) > 0).length;
        catDetail.failed = createdCategories.filter(c => (c.id ?? 0) === 0).length;
        catDetail.status = catDetail.failed > 0 ? 'error' : 'success';
        updateDetail(catDetail);
      }
    }

    // ─── Phase 2.5 : Taxes (extraction + création) ───
    if (productFiles.length > 0) {
      const allProductRows = productFiles.flatMap(f => f.rows);
      const uniqueTaxes = new Set<string>();
      allProductRows.forEach(row => {
        const taxVal = row['Taxe'] || row['taxe'] || row['tax'];
        if (taxVal && taxVal.trim() !== '') uniqueTaxes.add(taxVal.trim());
      });
      for (const taxStr of uniqueTaxes) {
        if (taxCache.has(taxStr)) continue;
        const rate = parseTaxRate(taxStr);
        try {
          const trgXml = buildTaxRulesGroupXml(`Taxe ${rate}%`);
          const trgRes = await apiService.post<any>('/tax_rules_groups', trgXml, { headers: { 'Content-Type': 'application/xml' } });
          const trgId = parseInt(trgRes?.prestashop?.tax_rules_group?.id || '0', 10);
          const tXml = buildTaxXml(`Tax ${rate}%`, rate);
          const tRes = await apiService.post<any>('/taxes', tXml, { headers: { 'Content-Type': 'application/xml' } });
          const tId = parseInt(tRes?.prestashop?.tax?.id || '0', 10);
          if (trgId > 0 && tId > 0) {
            const trXml = buildTaxRuleXml(trgId, tId);
            await apiService.post<any>('/tax_rules', trXml, { headers: { 'Content-Type': 'application/xml' } });
            taxCache.set(taxStr, { id_tax_rules_group: trgId, rate });
          }
        } catch (e) {
          console.error(`Erreur création taxe "${taxStr}"`, e);
        }
      }
    }


    const productCache = new Map<string, ProductCacheInfo>(); // reference -> id_product + prix_ttc + rate
    if (productFiles.length > 0) {
      reportProgress('importing', 'Import des produits');

      const productDetail: ImportDetail = {
        entity: 'product',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: productFiles.reduce((sum, f) => sum + f.rows.length, 0),
        errors: [],
      };
      details.push(productDetail);

      const mapperContext: ColumnMapperContext = { categoryMap };
      const productMappings = getColumnMappings('product');
      const productFixed = getFixedValues('product');

      for (const pf of productFiles) {
        for (let i = 0; i < pf.rows.length; i++) {
try {
            const mapped = mapRow(pf.rows[i], productMappings, productFixed, mapperContext);

            // Générer link_rewrite si absent
            if (mapped.name && !mapped.link_rewrite) {
              mapped.link_rewrite = slugify(mapped.name);
            }

            // Récupérer taxe et calculer prix HT
            const rawTax = pf.rows[i]['Taxe'] || pf.rows[i]['taxe'] || pf.rows[i]['tax'];
            const taxInfo = rawTax && rawTax.trim() !== ''
              ? (taxCache.get(rawTax.trim()) ?? taxCache.get(rawTax.trim()))
              : undefined;
            mapped.id_tax_rules_group = String(taxInfo?.id_tax_rules_group || 1);
            const rawPrice = pf.rows[i]['prix_ttc'] || pf.rows[i]['prix'] || pf.rows[i]['price'] || '0';
            const prixTtc = parseFloat(rawPrice.replace(',', '.'));
            const rate = taxInfo?.rate || 0;
            const priceHt = rate > 0 ? prixTtc / (1 + (rate / 100)) : prixTtc;
            mapped.price = String(priceHt);

            const categoryId = mapped.id_category_default
              ? parseInt(mapped.id_category_default, 10)
              : undefined;
            const xml = buildProductXml(mapped, categoryId ? [categoryId] : undefined);
            const response = await apiService.post<any>('/products', xml, {
              headers: { 'Content-Type': 'application/xml' },
            });
            const createdProductId = parseInt(response?.prestashop?.product?.id || '0', 10);
            if (createdProductId > 0 && mapped.reference) {
                productCache.set(mapped.reference, { id_product: createdProductId, prix_ttc: prixTtc, rate });
            }

            // Récupérer taxe et calculer prix HT
            const rawTax = pf.rows[i]['Taxe'] || pf.rows[i]['taxe'] || pf.rows[i]['tax'];
            const taxInfo = rawTax && rawTax.trim() !== ''
              ? (taxCache.get(rawTax.trim()) ?? taxCache.get(rawTax.trim()))
              : undefined;
            mapped.id_tax_rules_group = String(taxInfo?.id_tax_rules_group || 1);
            const rawPrice = pf.rows[i]['prix_ttc'] || pf.rows[i]['prix'] || pf.rows[i]['price'] || '0';
            const prixTtc = parseFloat(rawPrice.replace(',', '.'));
            const rate = taxInfo?.rate || 0;
            const priceHt = rate > 0 ? prixTtc / (1 + (rate / 100)) : prixTtc;
            mapped.price = String(priceHt);

            const categoryId = mapped.id_category_default
              ? parseInt(mapped.id_category_default, 10)
              : undefined;
            const xml = buildProductXml(mapped, categoryId ? [categoryId] : undefined);
            const response = await apiService.post<any>('/products', xml, {
              headers: { 'Content-Type': 'application/xml' },
            });
            const createdProductId = parseInt(response?.prestashop?.product?.id || '0', 10);
            if (createdProductId > 0 && mapped.reference) {
                productCache.set(mapped.reference, { id_product: createdProductId, prix_ttc: prixTtc, rate });
            }
            productDetail.imported++;
          } catch (error: any) {
            productDetail.failed++;
            productDetail.errors.push(buildError(i, pf.rows[i], error));
          }
          updateDetail(productDetail);
        }
      }

      productDetail.status = productDetail.failed > 0 ? 'error' : 'success';
      allSuccess = allSuccess && productDetail.failed === 0;
    }

    // ═══════════════════ PHASE 4 : Images ═══════════════════
    if (hasImages) {
      reportProgress('images', 'Upload des images');

      const imageDetail: ImportDetail = {
        entity: 'images',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: allImages.length,
        errors: [],
      };
      details.push(imageDetail);

      const legacyProductIdCache = new Map<string, number>();
      for (const [ref, info] of productCache) {
        legacyProductIdCache.set(ref, info.id_product);
      }
      const imageResult = await uploadProductImages(allImages, legacyProductIdCache, (done, total) => {
        imageDetail.imported = done - imageDetail.failed;
        updateDetail(imageDetail);
      });

      imageDetail.imported = imageResult.uploaded;
      imageDetail.failed = imageResult.failed;
      imageDetail.errors = imageResult.errors;
      imageDetail.status = imageResult.failed > 0 ? 'error' : 'success';
      allSuccess = allSuccess && imageResult.failed === 0;
      updateDetail(imageDetail);
    }

    // ═══════════════════ PHASE 5 : Combinaisons ═══════════════════
    const combinationFiles = parsedFiles.filter(f => f.entity === 'combination');
    if (combinationFiles.length > 0) {
      reportProgress('importing', 'Import des combinaisons');

      const combDetail: ImportDetail = {
        entity: 'combination',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: combinationFiles.reduce((sum, f) => sum + f.rows.length, 0),
        errors: [],
      };
      details.push(combDetail);

      const combMappings = getColumnMappings('combination');
      const combFixed = getFixedValues('combination');

      // ── Attribute extraction & creation ──
      const attrGroupCache = new Map<string, number>(); // attributeName -> id_attribute_group
      const attrValueCache = new Map<string, number>(); // groupName-valueName -> id_product_option_value

      for (const cf of combinationFiles) {
        for (const row of cf.rows) {
          const optName = row['spécificité'] || row['specificite'] || row['spǸcificitǸ'] || row['attribut'];
          const valName = row['valeur'] || row['valeur_attribut'];
          if (!optName || !valName) continue;

          if (!attrGroupCache.has(optName)) {
            const optXml = buildProductOptionXml(optName);
            const optRes = await apiService.post<any>('/product_options', optXml, { headers: { 'Content-Type': 'application/xml' } });
            const idOpt = parseInt(optRes?.prestashop?.product_option?.id || '0', 10);
            if (idOpt > 0) attrGroupCache.set(optName, idOpt);
          }
          const cacheKey = `${optName}-${valName}`;
          const idOpt = attrGroupCache.get(optName);
          if (idOpt && !attrValueCache.has(cacheKey)) {
            const valXml = buildProductOptionValueXml(idOpt, valName);
            const valRes = await apiService.post<any>('/product_option_values', valXml, { headers: { 'Content-Type': 'application/xml' } });
            const idVal = parseInt(valRes?.prestashop?.product_option_value?.id || '0', 10);
            if (idVal > 0) attrValueCache.set(cacheKey, idVal);
          }
        }
      }

      // ── Combination creation + stock update ──
      for (const cf of combinationFiles) {
        for (let i = 0; i < cf.rows.length; i++) {
          try {
            const mapped = mapRow(cf.rows[i], combMappings, combFixed);
            const reference = mapped.reference || cf.rows[i].reference || '';
            const optName = cf.rows[i]['spécificité'] || cf.rows[i]['specificite'] || cf.rows[i]['spǸcificitǸ'] || cf.rows[i]['attribut'];
            const valName = cf.rows[i]['valeur'] || cf.rows[i]['valeur_attribut'];
            const rawCombPrice = cf.rows[i]['prix_vente_ttc'] || cf.rows[i]['prix'] || cf.rows[i]['price'] || '0';
            const combPrixTtc = parseFloat(rawCombPrice.replace(',', '.'));

            // Vérifier que le produit parent existe
            const parentInfo = productCache.get(reference);
            if (!parentInfo) {
              combDetail.failed++;
              combDetail.errors.push({ row: i + 1, field: 'reference', value: reference, message: `Produit parent introuvable pour "${reference}"`, code: 'MISSING_DEPENDENCY' });
              continue;
            }
            mapped.id_product = String(parentInfo.id_product);

            let idProductAttribute = 0;

            if (optName && valName) {
              // Real combination
              const impactTtc = combPrixTtc - parentInfo.prix_ttc;
              const impactHt = impactTtc / (1 + (parentInfo.rate / 100));
              mapped.price = String(impactHt);
              mapped.reference = `${reference}-${valName}`;

              const attrId = attrValueCache.get(`${optName}-${valName}`);
              const xml = buildCombinationXml(mapped, attrId ? [attrId] : []);
              const res = await apiService.post<any>('/combinations', xml, { headers: { 'Content-Type': 'application/xml' } });
              idProductAttribute = parseInt(res?.prestashop?.combination?.id || '0', 10);
              if (idProductAttribute > 0) {
                combReferenceCache.set(`${reference}-${valName}`, idProductAttribute);
              }
            } else {
              // No combination — update parent price if different
              if (Math.abs(combPrixTtc - parentInfo.prix_ttc) > 0.01) {
                // Update parent product price via PUT
                const newHt = combPrixTtc / (1 + (parentInfo.rate / 100));
                const getRes = await apiService.get<any>(`/products/${parentInfo.id_product}`);
                const productXml = getRes?.prestashop?.product;
                if (productXml) {
                  productXml.price = String(newHt);
                  await apiService.put(`/products/${parentInfo.id_product}`, { prestashop: { product: productXml } }, { headers: { 'Content-Type': 'application/xml' } });
                }
              }
            }

            // Stock update (PUT on auto-generated stock_available)
            const qtyStr = cf.rows[i]['stock_initial'] || mapped.quantity || cf.rows[i].stock || '0';
            const qty = parseInt(qtyStr, 10);
            if (!isNaN(qty)) {
              try {
                let stockUrl = `/stock_availables?filter[id_product]=${parentInfo.id_product}&display=full`;
                if (idProductAttribute > 0) stockUrl += `&filter[id_product_attribute]=${idProductAttribute}`;
                else stockUrl += `&filter[id_product_attribute]=0`;

                const stockRes = await apiService.get<any>(stockUrl);
                const stocks = stockRes?.prestashop?.stock_availables?.stock_available || stockRes?.stock_availables?.stock_available;
                const stockList = Array.isArray(stocks) ? stocks : (stocks ? [stocks] : []);
                if (stockList.length > 0) {
                  const stockRow = stockList[0];
                  const stockId = typeof stockRow.id === 'object' ? stockRow.id._ : stockRow.id;
                  const putXml = buildStockAvailableXml({
                    id_product: String(parentInfo.id_product),
                    id_product_attribute: String(idProductAttribute),
                    quantity: String(qty),
                    id_shop: stockRow.id_shop || '1',
                  }, parseInt(stockId, 10));
                  await apiService.put(`/stock_availables/${stockId}`, putXml, { headers: { 'Content-Type': 'application/xml' } });
                }
              } catch { /* stock update error logged silently */ }
            }

            combDetail.imported++;
          } catch (error: any) {
            combDetail.failed++;
            combDetail.errors.push(buildError(i, cf.rows[i], error));
          }
          updateDetail(combDetail);
        }
      }

      combDetail.status = combDetail.failed > 0 ? 'error' : 'success';
      allSuccess = allSuccess && combDetail.failed === 0;
    }

    // ═══════════════════ PHASE 6 : Clients ═══════════════════
    const customerFiles = parsedFiles.filter(f => f.entity === 'customer' || f.entity === 'order');
    const customerIdCache = new Map<string, number>(); // email → id_customer

    if (customerFiles.length > 0) {
      reportProgress('importing', 'Import des clients');

      const custDetail: ImportDetail = {
        entity: 'customer',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: 0,
        errors: [],
      };
      details.push(custDetail);

      const custMappings = getColumnMappings('customer');
      const custFixed = getFixedValues('customer');

      // Extraire les clients uniques (par email)
      const uniqueCustomers = new Map<string, Record<string, string>>();

      for (const cf of customerFiles) {
        for (const row of cf.rows) {
          const mapped = mapRow(row, custMappings, custFixed);
          const email = mapped.email || '';
          if (email && !uniqueCustomers.has(email)) {
            uniqueCustomers.set(email, mapped);
          }
        }
      }

      custDetail.total = uniqueCustomers.size;

      for (const [email, mapped] of uniqueCustomers) {
        try {
          // Vérifier si le client existe déjà
          const existingId = await findCustomerByEmail(email);
          if (existingId) {
            customerIdCache.set(email, existingId);
            custDetail.imported++;
            continue;
          }

          // Créer le client
          const xml = buildCustomerXml(mapped);
          const response = await apiService.post<any>('/customers', xml, {
            headers: { 'Content-Type': 'application/xml' },
          });

          // Récupérer l'ID créé
          const createdId = parseInt(
            response?.prestashop?.customer?.id || '0', 10
          );
          if (createdId > 0) {
            customerIdCache.set(email, createdId);
          }
          custDetail.imported++;
        } catch (error: any) {
          custDetail.failed++;
          custDetail.errors.push({
            row: 0,
            field: 'email',
            value: email,
            message: extractErrorMessage(error),
            code: 'API_ERROR',
          });
        }
        updateDetail(custDetail);
      }

      custDetail.status = custDetail.failed > 0 ? 'error' : 'success';
      allSuccess = allSuccess && custDetail.failed === 0;
    }

    // ═══════════════════ PHASE 7 : Adresses + Commandes ═══════════════════
    const orderFiles = parsedFiles.filter(f => f.entity === 'order');
    if (orderFiles.length > 0) {
      reportProgress('importing', 'Création des adresses et commandes');

      // Créer les adresses pour chaque client
      const addressIdCache = new Map<string, number>(); // email → id_address
      const addressDetail: ImportDetail = {
        entity: 'address',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: customerIdCache.size,
        errors: [],
      };
      details.push(addressDetail);

      const orderMappings = getColumnMappings('order');
      const orderFixed = getFixedValues('order');

      // Collecter les infos d'adresses depuis les lignes de commande
      for (const of_ of orderFiles) {
        for (const row of of_.rows) {
          const mapped = mapRow(row, orderMappings, orderFixed);
          const email = mapped.customer_email || '';
          const customerId = customerIdCache.get(email);

          if (customerId && !addressIdCache.has(email)) {
            try {
              const addressData: Record<string, string> = {
                id_customer: String(customerId),
                firstname: mapped.customer_firstname || 'Inconnu',
                lastname: mapped.customer_lastname || 'Inconnu',
                address1: mapped.address1 || 'Non renseignée',
                city: mapped.city || 'Non renseignée',
                postcode: mapped.postcode || '00000',
                id_country: '8', // France
                alias: 'Import',
              };

              const xml = buildAddressXml(addressData);
              const response = await apiService.post<any>('/addresses', xml, {
                headers: { 'Content-Type': 'application/xml' },
              });
              const addressId = parseInt(
                response?.prestashop?.address?.id || '0', 10
              );
              if (addressId > 0) {
                addressIdCache.set(email, addressId);
              }
              addressDetail.imported++;
            } catch (error: any) {
              addressDetail.failed++;
              addressDetail.errors.push({
                row: 0,
                field: 'address',
                value: email,
                message: extractErrorMessage(error),
                code: 'API_ERROR',
              });
            }
            updateDetail(addressDetail);
          }
        }
      }

      addressDetail.status = addressDetail.failed > 0 ? 'error' : 'success';

      // Import des commandes
      reportProgress('importing', 'Import des commandes');

      const orderDetail: ImportDetail = {
        entity: 'order',
        status: 'in_progress',
        imported: 0,
        failed: 0,
        total: orderFiles.reduce((sum, f) => sum + f.rows.length, 0),
        errors: [],
      };
      details.push(orderDetail);

      for (const of_ of orderFiles) {
        for (let i = 0; i < of_.rows.length; i++) {
          try {
            const mapped = mapRow(of_.rows[i], orderMappings, orderFixed);
            const email = mapped.customer_email || '';
            const customerId = customerIdCache.get(email);
            const addressId = addressIdCache.get(email);

            if (!customerId) {
              orderDetail.failed++;
              orderDetail.errors.push({
                row: i + 1,
                field: 'customer',
                value: email,
                message: `Client non trouvé pour "${email}"`,
                code: 'MISSING_DEPENDENCY',
              });
              continue;
            }

            // Parser le panier
            const cartString = mapped.cart_items || '';
            const cartItems = parseCartString(cartString);

            // Résoudre les références produit → IDs
            const cartRows: { id_product: number; quantity: number }[] = [];
            for (const item of cartItems) {
              const productId = await findProductByReference(item.reference);
              if (productId) {
                cartRows.push({ id_product: productId, quantity: item.quantity });
              }
            }

            // Créer le panier
            const cartData: Record<string, string> = {
              id_customer: String(customerId),
              id_address_delivery: String(addressId || 0),
              id_address_invoice: String(addressId || 0),
              id_currency: '1',
              id_lang: '1',
              id_carrier: '1',
            };

            const cartXml = buildCartXml(cartData, cartRows);
            const cartResponse = await apiService.post<any>('/carts', cartXml, {
              headers: { 'Content-Type': 'application/xml' },
            });
            const cartId = parseInt(
              cartResponse?.prestashop?.cart?.id || '0', 10
            );

            if (cartId > 0) {
              // Créer la commande
              const orderState = parseOrderState(mapped.current_state || '');
              const orderData: Record<string, string> = {
                id_customer: String(customerId),
                id_address_delivery: String(addressId || 0),
                id_address_invoice: String(addressId || 0),
                id_cart: String(cartId),
                id_currency: '1',
                id_lang: '1',
                id_carrier: '1',
                current_state: orderState,
                module: mapped.module || 'ps_checkpayment',
                payment: mapped.payment || 'Paiement à la livraison',
                total_paid: '0',
                total_paid_real: '0',
                total_paid_tax_incl: '0',
                total_paid_tax_excl: '0',
                total_products: '0',
                total_products_wt: '0',
                total_shipping: '0',
                total_shipping_tax_incl: '0',
                total_shipping_tax_excl: '0',
                conversion_rate: '1',
              };

              const orderXml = buildOrderXml(orderData);
              await apiService.post('/orders', orderXml, {
                headers: { 'Content-Type': 'application/xml' },
              });
              orderDetail.imported++;
            } else {
              orderDetail.failed++;
              orderDetail.errors.push({
                row: i + 1,
                field: 'cart',
                value: cartString,
                message: 'Échec de création du panier',
                code: 'API_ERROR',
              });
            }
          } catch (error: any) {
            orderDetail.failed++;
            orderDetail.errors.push(buildError(i, of_.rows[i], error));
          }
          updateDetail(orderDetail);
        }
      }

      orderDetail.status = orderDetail.failed > 0 ? 'error' : 'success';
      allSuccess = allSuccess && orderDetail.failed === 0;
    }

    reportProgress('complete', 'Import terminé');
    return { success: allSuccess, details };

  } catch (error) {
    console.error('Erreur d\'orchestration :', error);
    details.push({
      entity: 'system',
      status: 'error',
      imported: 0,
      failed: 0,
      total: 0,
      errors: [{
        row: 0,
        field: 'orchestration',
        value: '',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        code: 'API_ERROR',
      }],
    });
    reportProgress('error', 'Import échoué');
    return { success: false, details };
  }
}

// ──────────────────────────── Helpers ────────────────────────────

function detectEntityFromRows(rows: Record<string, string>[]): EntityType | 'unknown' {
  if (rows.length === 0) return 'unknown';
  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
  const hs = new Set(headers);

  // Utiliser les colonnes de détection du mapping
  const config = loadMappingConfig();
  const scores: Record<string, number> = {};

  for (const [entity, entityConfig] of Object.entries(config) as [string, any][]) {
    let score = 0;
    if (entityConfig.detectionColumns) {
      for (const col of entityConfig.detectionColumns) {
        if (hs.has(col.toLowerCase())) score += 10;
      }
    }
    if (entityConfig.columns) {
      for (const sourceCol of Object.keys(entityConfig.columns)) {
        if (hs.has(sourceCol.toLowerCase())) score += 2;
      }
    }
    scores[entity] = score;
  }

  let best = 'unknown';
  let bestScore = 4; // seuil minimum
  for (const [entity, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = entity;
    }
  }

  return best as EntityType | 'unknown';
}

async function importCategories(categories: CategoryInfo[]): Promise<CategoryInfo[]> {
  const results: CategoryInfo[] = [];
  for (const category of categories) {
    try {
      const mapped = mapRow(
          { name: category.name },
          getColumnMappings('category'),
          { ...getFixedValues('category'), id_parent: String(category.parentId) }
      );
      if (mapped.name) {
        mapped.link_rewrite = slugify(mapped.name);
      }
      const xml = buildCategoryXml(mapped);
      const response = await apiService.post('/categories', xml, {
        headers: { 'Content-Type': 'application/xml' },
      }) as { prestashop: { category: { id: string } } };
      const id = parseInt(response.prestashop.category.id, 10);
      results.push({ ...category, id });
    } catch (err: any) {
      const existingId = await fetchCategoryIdByName(category.name);
      if (existingId) {
        results.push({ ...category, id: existingId });
      } else {
        console.warn(`Catégorie "${category.name}" ignorée (création impossible)`);
        results.push({ ...category, id: 0 });
      }
    }
  }
  return results;
}

function buildError(rowIndex: number, row: Record<string, string>, error: any): ImportError {
  return {
    row: rowIndex + 1,
    field: 'row',
    value: JSON.stringify(row).substring(0, 100),
    message: extractErrorMessage(error),
    code: 'API_ERROR',
  };
}

function extractErrorMessage(error: any): string {
  let message = error.message || 'Erreur inconnue';
  if (error.response?.data) {
    if (typeof error.response.data === 'string') {
      const match = error.response.data.match(/<message><!\[CDATA\[(.*?)\]\]><\/message>/);
      message = match ? match[1] : error.response.data.substring(0, 200);
    } else if (error.response.data?.errors?.[0]?.message) {
      message = error.response.data.errors[0].message;
    }
  }
  return message;
}