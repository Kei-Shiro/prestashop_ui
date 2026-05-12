import type { CartItem } from '@features/import/types/import.types';

/**
 * Parse a cart string from PrestaShop format
 * Format: [("T_01";3;"ngoza"),("P_01";2;"mainty")]
 *
 * @param cartString - The cart string to parse
 * @returns Array of CartItem objects
 */
export function parseCartString(cartString: string): CartItem[] {
  if (!cartString || typeof cartString !== 'string') {
    return [];
  }

  // Remove external brackets
  let cleanedString = cartString.trim();
  if (cleanedString.startsWith('[') && cleanedString.endsWith(']')) {
    cleanedString = cleanedString.slice(1, -1);
  }

  if (!cleanedString) {
    return [];
  }

  const items: CartItem[] = [];

  // Split by ),( to separate items
  // First, handle the format: ("T_01";3;"ngoza"),("P_01";2;"mainty")
  const itemStrings = cleanedString.split('),(');

  for (const itemStr of itemStrings) {
    // Clean each item string
    let cleaned = itemStr.trim();
    // Remove leading ( and trailing )
    cleaned = cleaned.replace(/^\(|\)$/g, '');

    // Split by semicolon
    const parts = cleaned.split(';');

    if (parts.length >= 2) {
      // Extract reference (first part, remove quotes)
      let reference = parts[0].trim().replace(/^"|"$/g, '');

      // Extract quantity (second part)
      const quantity = parseInt(parts[1].trim(), 10);

      // Extract specificity (third part if exists, remove quotes)
      const specificity = parts[2]?.trim().replace(/^"|"$/g, '') || '';

      // Only add if we have a valid reference and quantity
      if (reference && !isNaN(quantity)) {
        items.push({
          reference,
          quantity,
          specificity
        });
      }
    }
  }

  return items;
}