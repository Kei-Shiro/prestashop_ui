/**
 * Import Orchestrator Service
 * Coordinates the entire import workflow: parsing, entity detection, category creation,
 * and product import in dependency order.
 */

import type {
  ImportFile,
  ImportProgress,
  ImportDetail,
  ColumnMapping,
  CategoryInfo
} from '@features/import/types/import.types';
import { parseCsvFile, parseCsvString } from './csv-parser.service';
import { extractZipFile } from './zip-extractor.service';
import { extractCategoriesFromProducts, buildCategoryIdMap } from './category-extractor';
import { mapRow, type ColumnMapperContext } from './column-mapper.service';
import { buildProductXml, buildCategoryXml, importToPrestaShop } from './prestashop-adapter';
import { resolveImportOrder, type ImportPhase } from './dependency-resolver';
import apiService from '@shared/services/api-service';

// Product column mappings (source → target with transforms)
const PRODUCT_MAPPINGS: ColumnMapping[] = [
  { sourceColumn: 'produit', targetColumn: 'name' },
  { sourceColumn: 'reference', targetColumn: 'reference' },
  { sourceColumn: 'prix_ttc', targetColumn: 'price' },
  { sourceColumn: 'Taxe', targetColumn: 'id_tax_rules_group', transform: 'taxe_to_id' },
  { sourceColumn: 'categorie', targetColumn: 'id_category_default', transform: 'categorie_to_id' },
  { sourceColumn: 'prix_achat', targetColumn: 'wholesale_price' }
];

// Fixed values for products
const PRODUCT_FIXED_VALUES: Record<string, string> = {
  'active': '1',
  'state': '1',
  'visibility': 'both',
  'available_for_order': '1',
  'show_price': '1'
};

// Category column mappings
const CATEGORY_MAPPINGS: ColumnMapping[] = [
  { sourceColumn: 'name', targetColumn: 'name' }
];

// Category fixed values
const CATEGORY_FIXED_VALUES: Record<string, string> = {
  'active': '1',
  'id_parent': '2' // Root category is typically 2 in PrestaShop
};

export interface OrchestratorOptions {
  onProgress?: (progress: ImportProgress) => void;
}

export interface OrchestratedFile {
  entity: 'product' | 'combination' | 'customer' | 'order' | 'category' | 'unknown';
  rows: Record<string, string>[];
  fileName: string;
}

/**
 * Orchestrate the complete import workflow
 * @param files - Array of ImportFile objects to process
 * @param options - Options including progress callback
 * @returns ImportResult with success status and details
 */
export async function orchestrateImport(
  files: ImportFile[],
  options: OrchestratorOptions = {}
): Promise<{ success: boolean; details: ImportDetail[] }> {
  const details: ImportDetail[] = [];
  let allSuccess = true;

  // Initialize progress callback
  const reportProgress = (phase: ImportProgress['phase'], currentStep: string, totalSteps: number, stepIndex: number) => {
    if (options.onProgress) {
      options.onProgress({
        phase,
        currentStep,
        totalSteps,
        currentStepIndex: stepIndex,
        percentage: Math.round((stepIndex / totalSteps) * 100),
        details
      });
    }
  };

  try {
    // ============================================
    // STEP 1: Parse all files
    // ============================================
    reportProgress('parsing', 'Parsing files', 5, 0);

    const parsedFiles: OrchestratedFile[] = [];

    for (const importFile of files) {
      let rows: Record<string, string>[] = [];
      let entity: OrchestratedFile['entity'] = 'unknown';

      if (importFile.type === 'zip') {
        // Extract CSV files from ZIP
        const extracted = await extractZipFile(importFile.file);
        for (const csvFile of extracted) {
          rows = parseCsvString(csvFile.content);
          entity = detectEntityFromRows(rows);
          parsedFiles.push({
            entity,
            rows,
            fileName: csvFile.filename
          });
        }
      } else {
        // Parse CSV directly
        const parsed = await parseCsvFile(importFile.file);
        // Re-parse to get full data
        const fileContent = await importFile.file.text();
        rows = parseCsvString(fileContent);
        entity = detectEntityFromRows(rows);
        parsedFiles.push({
          entity,
          rows,
          fileName: importFile.name
        });
      }
    }

    reportProgress('parsing', 'Files parsed successfully', 5, 1);

    // ============================================
    // STEP 2: Detect entities
    // ============================================
    reportProgress('mapping', 'Detecting entities', 5, 1);

    const entityTypes = parsedFiles.map(f => f.entity);
    console.log('Detected entities:', entityTypes);

    reportProgress('mapping', 'Entities detected', 5, 2);

    // ============================================
    // STEP 3: Extract and create categories
    // ============================================
    reportProgress('mapping', 'Extracting categories', 5, 2);

    // Find product files to extract categories from
    const productFiles = parsedFiles.filter(f => f.entity === 'product');
    let categoryMap: Record<string, number> = {};

    if (productFiles.length > 0) {
      // Extract unique categories from all product files
      const allProducts = productFiles.flatMap(f => f.rows);
      const categories: CategoryInfo[] = extractCategoriesFromProducts(allProducts, 'categorie');

      if (categories.length > 0) {
        // Create categories in PrestaShop
        const categoryDetails: ImportDetail = {
          entity: 'category',
          status: 'in_progress',
          imported: 0,
          failed: 0,
          errors: []
        };
        details.push(categoryDetails);

        const createdCategories = await importCategories(categories);

        // Build category name → ID map
        categoryMap = buildCategoryIdMap(createdCategories);
        console.log('Category map:', categoryMap);

        categoryDetails.status = 'success';
        categoryDetails.imported = createdCategories.filter(c => c.id).length;
      }
    }

    reportProgress('mapping', 'Categories extracted and created', 5, 3);

    // ============================================
    // STEP 4: Import products
    // ============================================
    reportProgress('importing', 'Importing products', 5, 3);

    const productDetails: ImportDetail = {
      entity: 'product',
      status: 'in_progress',
      imported: 0,
      failed: 0,
      errors: []
    };
    details.push(productDetails);

    const mapperContext: ColumnMapperContext = {
      categoryMap
    };

    for (const productFile of productFiles) {
      const results = await importEntities(
        'products',
        productFile.rows,
        PRODUCT_MAPPINGS,
        PRODUCT_FIXED_VALUES,
        mapperContext
      );

      productDetails.imported += results.success;
      productDetails.failed += results.failed;
      productDetails.errors.push(...results.errors);
    }

    productDetails.status = productDetails.failed > 0 ? 'error' : 'success';
    allSuccess = allSuccess && productDetails.failed === 0;

    reportProgress('importing', 'Products imported', 5, 4);

    // ============================================
    // STEP 5: Import other entities in dependency order
    // ============================================
    const otherEntities = parsedFiles.filter(f => f.entity !== 'product' && f.entity !== 'unknown');

    if (otherEntities.length > 0) {
      const activeEntities = otherEntities.map(f => f.entity);
      const importOrder = resolveImportOrder(activeEntities);

      for (const phase of importOrder) {
        const phaseEntities = otherEntities.filter(f => getEntityType(f.entity) === phase);

        for (const entityFile of phaseEntities) {
          const entityDetail: ImportDetail = {
            entity: entityFile.entity,
            status: 'in_progress',
            imported: 0,
            failed: 0,
            errors: []
          };
          details.push(entityDetail);

          // Use appropriate mappings based on entity type
          const mappings = getMappingsForEntity(entityFile.entity);
          const fixedValues = getFixedValuesForEntity(entityFile.entity);

          const results = await importEntities(
            phase,
            entityFile.rows,
            mappings,
            fixedValues,
            mapperContext
          );

          entityDetail.imported = results.success;
          entityDetail.failed = results.failed;
          entityDetail.errors.push(...results.errors);
          entityDetail.status = results.failed > 0 ? 'error' : 'success';
          allSuccess = allSuccess && results.failed === 0;
        }
      }
    }

    // ============================================
    // STEP 6: Complete
    // ============================================
    reportProgress('complete', 'Import complete', 5, 5);

    return { success: allSuccess, details };

  } catch (error) {
    console.error('Import orchestration failed:', error);

    // Add error detail
    details.push({
      entity: 'system',
      status: 'error',
      imported: 0,
      failed: 0,
      errors: [{
        row: 0,
        field: 'orchestration',
        value: '',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'API_ERROR'
      }]
    });

    reportProgress('error', 'Import failed', 5, 5);

    return { success: false, details };
  }
}

/**
 * Detect entity type from parsed rows
 */
function detectEntityFromRows(rows: Record<string, string>[]): OrchestratedFile['entity'] {
  if (rows.length === 0) return 'unknown';

  const headers = Object.keys(rows[0]).map(h => h.toLowerCase().trim());
  const headerSet = new Set(headers);

  // Check for product indicators
  if (headerSet.has('produit') || headerSet.has('product') || headerSet.has('prix_ttc')) {
    return 'product';
  }

  // Check for category indicators
  if (headerSet.has('categorie') && headerSet.size === 1) {
    return 'category';
  }

  // Check for customer indicators
  if (headerSet.has('email') || headerSet.has('e-mail')) {
    return 'customer';
  }

  // Check for combination indicators
  if (headerSet.has('reference') && headerSet.has('spécificité')) {
    return 'combination';
  }

  // Check for order indicators
  if (headerSet.has('commande') || headerSet.has('order')) {
    return 'order';
  }

  return 'unknown';
}

/**
 * Import categories to PrestaShop
 */
async function importCategories(categories: CategoryInfo[]): Promise<CategoryInfo[]> {
  const results: CategoryInfo[] = [];

  for (const category of categories) {
    try {
      const mappedData = mapRow(
        { name: category.name },
        CATEGORY_MAPPINGS,
        CATEGORY_FIXED_VALUES
      );

      const xml = buildCategoryXml(mappedData);
      const response = await apiService.post('/categories', xml, {
        headers: { 'Content-Type': 'application/xml' }
      }) as { prestashop: { category: { id: string } } };

      const id = parseInt(response.prestashop.category.id, 10);
      results.push({ ...category, id });
    } catch (error) {
      console.error(`Failed to create category "${category.name}":`, error);
      results.push({ ...category, id: 0 });
    }
  }

  return results;
}

/**
 * Import entities (products, combinations, etc.) to PrestaShop
 */
async function importEntities(
  endpoint: ImportPhase,
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  fixedValues: Record<string, string>,
  context?: ColumnMapperContext
): Promise<{ success: number; failed: number; errors: ImportDetail['errors'] }> {
  let success = 0;
  let failed = 0;
  const errors: ImportDetail['errors'] = [];

  // Map endpoint to API path
  const apiPath = getApiPath(endpoint);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const mappedData = mapRow(row, mappings, fixedValues, context);
      const xml = buildProductXml(mappedData); // Use product XML as default

      await apiService.post(apiPath, xml, {
        headers: { 'Content-Type': 'application/xml' }
      });

      success++;
    } catch (error) {
      failed++;
      errors.push({
        row: i + 1,
        field: 'row',
        value: JSON.stringify(row).substring(0, 100),
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'API_ERROR'
      });
    }
  }

  return { success, failed, errors };
}

/**
 * Map import phase to API endpoint path
 */
function getApiPath(phase: ImportPhase): string {
  const paths: Record<ImportPhase, string> = {
    categories: '/categories',
    products: '/products',
    product_options: '/product_options',
    product_option_values: '/product_option_values',
    combinations: '/combinations',
    stock_availables: '/stock_availables',
    customers: '/customers',
    addresses: '/addresses',
    orders: '/orders',
    order_details: '/order_details'
  };

  return paths[phase] || '/products';
}

/**
 * Get entity type from detected entity string
 */
function getEntityType(entity: string): ImportPhase {
  const mapping: Record<string, ImportPhase> = {
    product: 'products',
    category: 'categories',
    combination: 'combinations',
    customer: 'customers',
    order: 'orders'
  };

  return mapping[entity] || 'products';
}

/**
 * Get column mappings for entity type
 */
function getMappingsForEntity(entity: string): ColumnMapping[] {
  switch (entity) {
    case 'product':
      return PRODUCT_MAPPINGS;
    case 'category':
      return CATEGORY_MAPPINGS;
    default:
      return [];
  }
}

/**
 * Get fixed values for entity type
 */
function getFixedValuesForEntity(entity: string): Record<string, string> {
  switch (entity) {
    case 'product':
      return PRODUCT_FIXED_VALUES;
    case 'category':
      return CATEGORY_FIXED_VALUES;
    default:
      return {};
  }
}

export default {
  orchestrateImport
};