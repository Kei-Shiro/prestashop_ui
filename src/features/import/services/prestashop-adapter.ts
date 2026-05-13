import { slugify } from '@features/import/utils/slugify';


const LANG_FIELDS = ['name', 'link_rewrite', 'description', 'description_short',
    'meta_title', 'meta_description', 'meta_keywords', 'available_now', 'available_later',
    'delivery_in_stock', 'delivery_out_stock'];

const SHOP_LANG_IDS = [1];

function cdata(value: string): string {
    return `<![CDATA[${value}]]>`;
}

function langField(field: string, value: string, langIds: number[] = SHOP_LANG_IDS): string {
    const langs = langIds
        .map(id => `      <language id="${id}">${cdata(value)}</language>`)
        .join('\n');
    return `<${field}>\n${langs}\n    </${field}>`;
}

function simpleField(field: string, value: string): string {
    return `<${field}>${cdata(value)}</${field}>`;
}

function buildXml(entity: string, fields: [string, string][], associationsXml?: string): string {
    const xmlFields = fields.map(([key, val]) => {
        return LANG_FIELDS.includes(key) ? `    ${langField(key, val)}` : `    ${simpleField(key, val)}`;
    }).join('\n');

    const associations = associationsXml ? `\n${associationsXml}` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <${entity}>
${xmlFields}${associations}
  </${entity}>
</prestashop>`;
}

export function buildAssociationsXml(entityType: string, ids: number[]): string {
    if (ids.length === 0) return '';
    const singular = entityType.endsWith('ies') 
        ? entityType.slice(0, -3) + 'y' 
        : entityType.slice(0, -1);
        
    const items = ids.map(id => `        <${singular}><id>${id}</id></${singular}>`).join('\n');
    return `    <associations>
      <${entityType} nodeType="${singular}" api="${entityType}">
${items}
      </${entityType}>
    </associations>`;
}

/**
 * Associations pour les cart_rows (panier avec quantité)
 */
function buildCartRowsXml(cartRows: { id_product: number; quantity: number; id_product_attribute?: number }[]): string {
    if (cartRows.length === 0) return '';
    const items = cartRows.map(row => {
        const attrId = row.id_product_attribute || 0;
        return `        <cart_row>
          <id_product>${row.id_product}</id_product>
          <id_product_attribute>${attrId}</id_product_attribute>
          <quantity>${row.quantity}</quantity>
        </cart_row>`;
    }).join('\n');
    return `    <associations>
      <cart_rows>
${items}
      </cart_rows>
    </associations>`;
}

/**
 * Associations pour les order_rows
 */
function buildOrderRowsXml(orderRows: { product_id: number; product_quantity: number; product_price: string; product_name: string }[]): string {
    if (orderRows.length === 0) return '';
    const items = orderRows.map(row => {
        return `        <order_row>
          <product_id>${row.product_id}</product_id>
          <product_quantity>${row.product_quantity}</product_quantity>
          <product_price>${cdata(row.product_price)}</product_price>
          <product_name>${cdata(row.product_name)}</product_name>
        </order_row>`;
    }).join('\n');
    return `    <associations>
      <order_rows>
${items}
      </order_rows>
    </associations>`;
}

/**
 * Génère un mot de passe aléatoire sécurisé
 */
function generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    let password = '';
    for (let i = 0; i < array.length; i++) {
        password += chars[array[i] % chars.length];
    }
    return password;
}

// ──────────────────── Produit ────────────────────
export function buildProductXml(data: Record<string, string>, categoryIds?: number[]): string {
    data.price = (data.price || '0').replace(',', '.');
    data.wholesale_price = (data.wholesale_price || '0').replace(',', '.');
    console.log('[buildProductXml] Input data:', data);

    const product: Record<string, string> = {
        active: '1',
        state: '1',
        visibility: 'both',
        available_for_order: '1',
        show_price: '1',
        id_tax_rules_group: data.id_tax_rules_group || '1',
        id_category_default: data.id_category_default || '2',
        price: data.price || '0',
        reference: data.reference || '',
        name: data.name || 'Produit sans nom',
        link_rewrite: data.link_rewrite || slugify(data.name || 'produit'),
        description: data.description || '',
        description_short: data.description_short || '',
        available_now: data.available_now || '',
        available_later: data.available_later || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        meta_keywords: data.meta_keywords || '',
        condition: data.condition || 'new',
        id_default_combination: '0',
    };

    if (data.wholesale_price) product.wholesale_price = data.wholesale_price;
    if (data.ean13) product.ean13 = data.ean13;
    if (data.supplier_reference) product.supplier_reference = data.supplier_reference;
    if (data.weight) product.weight = data.weight;
    if (data.available_date) product.available_date = data.available_date;

    const categoryIdNum = parseInt(data.id_category_default, 10) || 2;
    const allCategoryIds = categoryIds && categoryIds.length > 0
        ? [categoryIdNum, ...categoryIds.filter(id => id !== categoryIdNum)]
        : [categoryIdNum];

    const associationsXml = buildAssociationsXml('categories', allCategoryIds);
    const xml = buildXml('product', Object.entries(product), associationsXml);
    console.log('[buildProductXml] Final XML:', xml);
    return xml;
}

// ──────────────────── Catégorie ────────────────────
export function buildCategoryXml(data: Record<string, string>, productIds?: number[]): string {
    const category: Record<string, string> = {
        active: data.active || '1',
        id_parent: data.id_parent || '2',
        id_shop_default: data.id_shop_default || '1',
        name: data.name || 'Catégorie sans nom',
        link_rewrite: data.link_rewrite || slugify(data.name || 'categorie'),
    };

    const associationsXml = productIds && productIds.length > 0
        ? buildAssociationsXml('products', productIds)
        : undefined;

    return buildXml('category', Object.entries(category), associationsXml);
}

// ──────────────────── Client ────────────────────
export function buildCustomerXml(data: Record<string, string>): string {
    // S'assurer que firstname/lastname ne sont jamais vides
    if (!data.firstname || data.firstname.trim() === '') data.firstname = 'Inconnu';
    if (!data.lastname || data.lastname.trim() === '') data.lastname = 'Inconnu';

    const customer: Record<string, string> = {
        active: data.active || '1',
        id_default_group: data.id_default_group || '3',
        newsletter: data.newsletter || '0',
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email || '',
        passwd: data.passwd || generatePassword(),
    };

    return buildXml('customer', Object.entries(customer));
}

// ──────────────────── Adresse ────────────────────
export function buildAddressXml(data: Record<string, string>): string {
    const address: Record<string, string> = {
        id_customer: data.id_customer || '0',
        id_country: data.id_country || '8', // France par défaut
        alias: data.alias || 'Adresse principale',
        firstname: data.firstname || 'Inconnu',
        lastname: data.lastname || 'Inconnu',
        address1: data.address1 || 'Non renseignée',
        city: data.city || 'Non renseignée',
        postcode: data.postcode || '00000',
    };

    if (data.phone) address.phone = data.phone;
    if (data.company) address.company = data.company;
    if (data.address2) address.address2 = data.address2;

    return buildXml('address', Object.entries(address));
}

// ──────────────────── Panier (Cart) ────────────────────
export function buildCartXml(
    data: Record<string, string>,
    cartRows: { id_product: number; quantity: number; id_product_attribute?: number }[]
): string {
    const cart: Record<string, string> = {
        id_customer: data.id_customer || '0',
        id_address_delivery: data.id_address_delivery || '0',
        id_address_invoice: data.id_address_invoice || '0',
        id_currency: data.id_currency || '1',
        id_lang: data.id_lang || '1',
        id_carrier: data.id_carrier || '1',
    };

    const associationsXml = buildCartRowsXml(cartRows);
    return buildXml('cart', Object.entries(cart), associationsXml);
}

// ──────────────────── Commande (Order) ────────────────────
export function buildOrderXml(
    data: Record<string, string>,
    orderRows?: { product_id: number; product_quantity: number; product_price: string; product_name: string }[]
): string {
    const order: Record<string, string> = {
        id_customer: data.id_customer || '0',
        id_address_delivery: data.id_address_delivery || '0',
        id_address_invoice: data.id_address_invoice || '0',
        id_cart: data.id_cart || '0',
        id_currency: data.id_currency || '1',
        id_lang: data.id_lang || '1',
        id_carrier: data.id_carrier || '1',
        current_state: data.current_state || '1',
        module: data.module || 'ps_checkpayment',
        payment: data.payment || 'Paiement à la livraison',
        total_paid: data.total_paid || '0',
        total_paid_real: data.total_paid_real || '0',
        total_paid_tax_incl: data.total_paid_tax_incl || '0',
        total_paid_tax_excl: data.total_paid_tax_excl || '0',
        total_products: data.total_products || '0',
        total_products_wt: data.total_products_wt || '0',
        total_shipping: data.total_shipping || '0',
        total_shipping_tax_incl: data.total_shipping_tax_incl || '0',
        total_shipping_tax_excl: data.total_shipping_tax_excl || '0',
        conversion_rate: data.conversion_rate || '1',
    };

    const associationsXml = orderRows ? buildOrderRowsXml(orderRows) : undefined;
    return buildXml('order', Object.entries(order), associationsXml);
}

// ──────────────────── Déclinaison ────────────────────
export function buildCombinationXml(data: Record<string, string>, optionValueIds?: number[]): string {
    data.price = (data.price || '0').replace(',', '.');
    data.wholesale_price = (data.wholesale_price || '0').replace(',', '.');

    const comb: Record<string, string> = {
        id_product: data.id_product || '',
        reference: data.reference || '',
        price: data.price,
        wholesale_price: data.wholesale_price || '0',
        default_on: data.default_on || '0',
        minimal_quantity: data.minimal_quantity || '1',
    };

    if (data.ean13) comb.ean13 = data.ean13;
    if (data.weight) comb.weight = data.weight;

    let associationsXml: string | undefined;
    if (optionValueIds && optionValueIds.length > 0) {
        const items = optionValueIds.map(id =>
            `        <product_option_value><id>${id}</id></product_option_value>`
        ).join('\n');
        associationsXml = `    <associations>
      <product_option_values>
${items}
      </product_option_values>
    </associations>`;
    }

    return buildXml('combination', Object.entries(comb), associationsXml);
}

// ──────────────────── Stock Available ────────────────────
export function buildStockAvailableXml(data: Record<string, string>, id?: number): string {
    const stock: Record<string, string> = {
        id_product: data.id_product || '0',
        id_product_attribute: data.id_product_attribute || '0',
        id_shop: data.id_shop || '1',
        quantity: data.quantity || '0',
        depends_on_stock: '0',
        out_of_stock: '2',
    };

    if (id !== undefined) stock.id = String(id);

    return buildXml('stock_available', Object.entries(stock));
}

// ──────────────────── Import direct ────────────────────
export async function importToPrestaShop(
    endpoint: string,
    data: Record<string, string>
): Promise<any> {
    const { default: apiService } = await import(
      /* @vite-ignore */ '@shared/services/api-service'
    );

    let xml: string;
    if (endpoint.includes('category')) xml = buildCategoryXml(data);
    else if (endpoint.includes('product')) xml = buildProductXml(data);
    else if (endpoint.includes('customer')) xml = buildCustomerXml(data);
    else if (endpoint.includes('combination')) xml = buildCombinationXml(data);
    else if (endpoint.includes('address')) xml = buildAddressXml(data);
    else xml = buildProductXml(data);

    return apiService.post(endpoint, xml, {
        headers: { 'Content-Type': 'application/xml' },
    });
}