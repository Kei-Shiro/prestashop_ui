import type { ColumnMapping } from '@features/import/types/import.types';
import { convertTaxeToId } from './tax-lookup';

export interface ColumnMapperContext {
  categoryMap?: Record<string, number>;
}

export function mapRow(
    row: Record<string, string>,
    mappings: ColumnMapping[],
    fixedValues: Record<string, string> = {},
    context?: ColumnMapperContext
): Record<string, string> {
  const result: Record<string, string> = { ...fixedValues };

  // Créer un index case-insensitive des colonnes
  const normalizedRow: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    normalizedRow[key.toLowerCase().trim()] = value;
  }

  for (const mapping of mappings) {
    const normalizedSource = mapping.sourceColumn.toLowerCase().trim();
    let sourceValue = normalizedRow[normalizedSource] ?? '';
    let transformedValue: string;

    switch (mapping.transform) {
      case 'taxe_to_id': {
        const taxId = convertTaxeToId(sourceValue);
        transformedValue = String(taxId > 0 ? taxId : 1); // fallback
        break;
      }
      case 'categorie_to_id': {
        if (context?.categoryMap && sourceValue) {
          const id = context.categoryMap[sourceValue];
          transformedValue = String(id && id > 0 ? id : 2); // fallback Accueil
        } else {
          transformedValue = '2';
        }
        break;
      }
      case 'format_price': {
        transformedValue = sourceValue.replace(',', '.').replace(/[^\d.]/g, '') || '0';
        break;
      }
      default:
        // Normalisation des champs prix (fallback)
        if (
            mapping.targetColumn === 'price' ||
            mapping.targetColumn === 'wholesale_price' ||
            mapping.targetColumn === 'unit_price_tax_excl' ||
            mapping.targetColumn === 'unit_price_tax_incl'
        ) {
          sourceValue = sourceValue.replace(',', '.').replace(/[^\d.]/g, '');
        }
        transformedValue = sourceValue;
    }
    // Ne pas écraser une valeur valide déjà trouvée par un autre alias vide
    if (sourceValue !== '' || result[mapping.targetColumn] === undefined || result[mapping.targetColumn] === '') {
      result[mapping.targetColumn] = transformedValue;
    }
  }

  return result;
}