import apiService from '@shared/services/api-service';

// Fields that need <language id="1"> wrapper
const LANG_FIELDS = ['name', 'link_rewrite', 'description', 'description_short'];

/**
 * Escapes XML special characters and wraps in CDATA
 */
function formatValue(value: string | undefined): string {
    if (!value) return '';
    // Wrap in CDATA to handle special characters safely
    return `<![CDATA[${value}]]>`;
}

/**
 * Builds a field value, handling language-specific wrapping
 */
function buildFieldValue(fieldName: string, value: string): string {
    if (LANG_FIELDS.includes(fieldName)) {
        return `<language id="1">${formatValue(value)}</language>`;
    }
    return formatValue(value);
}

/**
 * Builds XML for a PrestaShop product
 */
export function buildProductXml(data: Record<string, string>): string {
    const fields = Object.entries(data)
        .map(([key, value]) => `    <${key}>${buildFieldValue(key, value)}</${key}>`)
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
${fields}
  </product>
</prestashop>`;
}

/**
 * Builds XML for a PrestaShop category
 */
export function buildCategoryXml(data: Record<string, string>): string {
    const fields = Object.entries(data)
        .map(([key, value]) => `    <${key}>${buildFieldValue(key, value)}</${key}>`)
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <category>
${fields}
  </category>
</prestashop>`;
}

/**
 * Builds XML for a PrestaShop combination (product variant)
 */
export function buildCombinationXml(data: Record<string, string>): string {
    // Build associations if present (e.g., product_id, images)
    let associationsXml = '';
    if (data.associations) {
        associationsXml = `    <associations>
${data.associations}
    </associations>`;
    }

    const fields = Object.entries(data)
        .filter(([key]) => key !== 'associations')
        .map(([key, value]) => `    <${key}>${buildFieldValue(key, value)}</${key}>`)
        .join('\n');

    const combinationContent = fields + (associationsXml ? '\n' + associationsXml : '');

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <combination>
${combinationContent}
  </combination>
</prestashop>`;
}

/**
 * Determines which XML builder to use based on endpoint
 */
function getXmlBuilder(endpoint: string): (data: Record<string, string>) => string {
    const normalizedEndpoint = endpoint.toLowerCase();

    if (normalizedEndpoint.includes('product')) {
        return buildProductXml;
    }
    if (normalizedEndpoint.includes('category')) {
        return buildCategoryXml;
    }
    if (normalizedEndpoint.includes('combination')) {
        return buildCombinationXml;
    }

    // Default to product
    return buildProductXml;
}

/**
 * Imports data to PrestaShop via the API
 * @param endpoint - The API endpoint (e.g., '/products', '/categories', '/combinations')
 * @param data - The data record to convert to XML and import
 */
export async function importToPrestaShop(
    endpoint: string,
    data: Record<string, string>
): Promise<void> {
    const xmlBuilder = getXmlBuilder(endpoint);
    const xml = xmlBuilder(data);

    await apiService.post(endpoint, xml, {
        headers: {
            'Content-Type': 'application/xml',
        },
    });
}