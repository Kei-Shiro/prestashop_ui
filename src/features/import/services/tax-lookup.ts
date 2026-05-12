/**
 * Mapping from tax percentage strings to PrestaShop tax rule IDs
 */
const TAX_MAPPING: Record<string, number> = {
  '0%': 1,
  '0': 1,
  '5.5%': 2,
  '5,5%': 2,
  '10%': 3,
  '10': 3,
  '11.65%': 4,
  '11,65%': 4,
  '20%': 5,
  '20': 5
};

/**
 * Convert a tax percentage string to PrestaShop tax rule ID
 *
 * @param taxeString - The tax string (e.g., "20%", "10", "5,5%")
 * @returns The PrestaShop tax rule ID, or 0 if not found
 */
export function convertTaxeToId(taxeString: string): number {
  if (!taxeString || typeof taxeString !== 'string') {
    return 0;
  }

  // Normalize the input: replace comma with dot
  const normalized = taxeString
    .trim()
    .replace(',', '.');

  // Try exact match first
  if (TAX_MAPPING[normalized] !== undefined) {
    return TAX_MAPPING[normalized];
  }

  // Try with % suffix if not found
  const withPercent = normalized.includes('%') ? normalized : `${normalized}%`;
  if (TAX_MAPPING[withPercent] !== undefined) {
    return TAX_MAPPING[withPercent];
  }

  // Return 0 if not found
  return 0;
}