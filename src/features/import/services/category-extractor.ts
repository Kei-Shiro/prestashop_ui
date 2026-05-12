import type { CategoryInfo } from '@features/import/types/import.types';

/**
 * Extract unique categories from product rows
 * @param products - Array of product records with column key-value pairs
 * @param categoryColumn - The column name containing category data (default: 'categorie')
 * @returns Array of CategoryInfo with unique category names, all with parentId: 2
 */
export function extractCategoriesFromProducts(
  products: Record<string, string>[],
  categoryColumn: string = 'categorie'
): CategoryInfo[] {
  const categorySet = new Set<string>();

  // Iterate through products and extract unique category names
  for (const product of products) {
    const categoryName = product[categoryColumn]?.trim();
    if (categoryName && categoryName !== '') {
      categorySet.add(categoryName);
    }
  }

  // Convert Set to array of CategoryInfo
  return Array.from(categorySet).map((name) => ({
    name,
    parentId: 2,
  }));
}

/**
 * Build a mapping of category name to ID
 * @param categories - Array of CategoryInfo with optional id
 * @returns Record mapping category name to ID
 */
export function buildCategoryIdMap(
  categories: CategoryInfo[]
): Record<string, number> {
  const idMap: Record<string, number> = {};

  for (const category of categories) {
    if (category.id !== undefined) {
      idMap[category.name] = category.id;
    }
  }

  return idMap;
}