/**
 * Dependency Resolver Service
 * Defines the correct order of import based on FK dependencies.
 */

export type ImportPhase =
  | 'categories'
  | 'products'
  | 'product_options'
  | 'product_option_values'
  | 'combinations'
  | 'stock_availables'
  | 'customers'
  | 'addresses'
  | 'orders'
  | 'order_details';

/**
 * Complete import order based on FK dependencies:
 * 1. categories (no deps)
 * 2. products (depends on categories)
 * 3. product_options (no deps)
 * 4. product_option_values (depends on product_options)
 * 5. combinations (depends on products)
 * 6. stock_availables (depends on combinations)
 * 7. customers (no deps)
 * 8. addresses (depends on customers)
 * 9. orders (depends on customers)
 * 10. order_details (depends on orders, products)
 */
export const IMPORT_ORDER: ImportPhase[] = [
  'categories',
  'products',
  'product_options',
  'product_option_values',
  'combinations',
  'stock_availables',
  'customers',
  'addresses',
  'orders',
  'order_details',
];

/**
 * Maps each phase to its dependencies (phases that must run before it)
 */
const PHASE_DEPENDENCIES: Record<ImportPhase, ImportPhase[]> = {
  categories: [],
  products: ['categories'],
  product_options: [],
  product_option_values: ['product_options'],
  combinations: ['products', 'categories'],
  stock_availables: ['combinations', 'products', 'categories'],
  customers: [],
  addresses: ['customers'],
  orders: ['customers'],
  order_details: ['orders', 'products', 'categories'],
};

/**
 * Maps entity names (as specified in config) to their corresponding phase
 */
const ENTITY_TO_PHASE: Record<string, ImportPhase> = {
  category: 'categories',
  product: 'products',
  products: 'products',
  product_option: 'product_options',
  product_option_value: 'product_option_values',
  combination: 'combinations',
  combinations: 'combinations',
  stock_available: 'stock_availables',
  stock_availables: 'stock_availables',
  customer: 'customers',
  customers: 'customers',
  address: 'addresses',
  addresses: 'addresses',
  order: 'orders',
  orders: 'orders',
  order_detail: 'order_details',
  order_details: 'order_details',
};

/**
 * Resolves the import order based on active entities.
 * Includes both explicitly active entities and their implied dependencies.
 *
 * @param activeEntities - List of entity names that are active for import
 * @returns Ordered list of phases to import
 */
export function resolveImportOrder(activeEntities: string[]): ImportPhase[] {
  // Convert entity names to phases and collect all required phases
  const requiredPhases = new Set<ImportPhase>();

  for (const entity of activeEntities) {
    const phase = ENTITY_TO_PHASE[entity.toLowerCase()];
    if (phase) {
      // Add the phase itself
      requiredPhases.add(phase);

      // Add all its dependencies recursively
      const dependencies = getAllDependencies(phase);
      dependencies.forEach((dep) => requiredPhases.add(dep));
    }
  }

  // Return phases in the defined import order
  return IMPORT_ORDER.filter((phase) => requiredPhases.has(phase));
}

/**
 * Recursively gets all dependencies for a phase
 */
function getAllDependencies(phase: ImportPhase): ImportPhase[] {
  const directDeps = PHASE_DEPENDENCIES[phase];
  const allDeps: ImportPhase[] = [...directDeps];

  for (const dep of directDeps) {
    const transitiveDeps = getAllDependencies(dep);
    transitiveDeps.forEach((td) => {
      if (!allDeps.includes(td)) {
        allDeps.push(td);
      }
    });
  }

  return allDeps;
}

/**
 * Checks if a phase has a specific dependency
 */
export function hasDependency(phase: ImportPhase, dependency: ImportPhase): boolean {
  const allDeps = getAllDependencies(phase);
  return allDeps.includes(dependency);
}

/**
 * Gets the direct dependencies for a phase
 */
export function getDirectDependencies(phase: ImportPhase): ImportPhase[] {
  return PHASE_DEPENDENCIES[phase] || [];
}