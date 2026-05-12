import type { ColumnMapping } from '@features/import/types/import.types';
import { convertTaxeToId } from './tax-lookup';

export interface ColumnMapperContext {
  categoryMap?: Record<string, number>;
}

/**
 * Apply column mappings with transformations to convert source data to PrestaShop format
 *
 * @param row - Source row data as key-value pairs
 * @param mappings - Array of column mappings to apply
 * @param fixedValues - Fixed values to include in the output
 * @param context - Additional context for transformations (e.g., categoryMap)
 * @returns Mapped record with target column names and transformed values
 */
export function mapRow(
  row: Record<string, string>,
  mappings: ColumnMapping[],
  fixedValues: Record<string, string> = {},
  context?: ColumnMapperContext
): Record<string, string> {
  // Start with fixedValues
  const result: Record<string, string> = { ...fixedValues };

  // For each mapping, apply the transformation and add to result
  for (const mapping of mappings) {
    const sourceValue = row[mapping.sourceColumn] ?? '';

    let transformedValue: string;

    // Apply transform if specified
    switch (mapping.transform) {
      case 'taxe_to_id':
        transformedValue = String(convertTaxeToId(sourceValue));
        break;

      case 'categorie_to_id':
        if (context?.categoryMap && sourceValue) {
          transformedValue = String(context.categoryMap[sourceValue] ?? 0);
        } else {
          transformedValue = '0';
        }
        break;

      case 'none':
      default:
        transformedValue = sourceValue;
        break;
    }

    result[mapping.targetColumn] = transformedValue;
  }

  return result;
}