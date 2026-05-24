/**
 * Product model — follows /products?schema=blank from the PrestaShop API.
 *
 * Fields are normalized by productService (multilingual → string, active → boolean,
 * price → TTC string, id → id_product).
 * Associations (images, categories) are enriched during fetching.
 */
import type { LangField, IdOnly } from './common';

/** Canonical Product model used throughout the application. */
export interface Product {
    /** API field: id */
    id_product: string;
    id_manufacturer?: string;
    id_supplier?: string;
    id_category_default?: string;
    id_tax_rules_group?: string;
    id_default_image?: string;
    id_default_combination?: string;
    reference?: string;
    supplier_reference?: string;
    ean13?: string;
    isbn?: string;
    upc?: string;
    mpn?: string;
    /** TTC price — calculated by productService using tax rate */
    price: string;
    wholesale_price?: string;
    /** Enriched by productService from tax_rules */
    tax_rate?: number;
    /** Normalized from API '0'/'1' */
    active: boolean;
    /** Extracted from multilingual API field */
    name: string;
    /** Extracted from multilingual API field */
    description: string;
    description_short?: string;
    link_rewrite?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    /** Enriched from stock_availables */
    quantity: string;
    /** Enriched from associations.images */
    images?: string[];
    /** Resolves to id_category_default */
    category?: string;
    /** From associations.categories */
    categories?: string[];
    /** API field: available_date */
    date_availability?: string;
    date_add?: string;
    date_upd?: string;
    product_option_values?: IdOnly[];
    weight?: string;
    width?: string;
    height?: string;
    depth?: string;
    condition?: string;
    visibility?: string;
    minimal_quantity?: string;
    state?: string;
    product_type?: string;
    on_sale?: string;
    online_only?: string;
    available_for_order?: string;
    show_price?: string;
    is_virtual?: string;
    unity?: string;
    unit_price?: string;
    ecotax?: string;
}

/** Payload for POST /products — mirrors API required fields. */
export interface ProductCreatePayload {
    name: LangField;
    link_rewrite: LangField;
    reference: string;
    /** HT price */
    price: number;
    wholesale_price: number;
    id_tax_rules_group: number;
    id_category_default: number;
    available_date: string;
    active: number;
    state: number;
    visibility: string;
    minimal_quantity: number;
    product_type: string;
    condition: string;
    available_for_order: number;
    show_price: number;
    associations?: {
        categories: { category: Array<{ id: number }> };
    };
}

/** Payload for PUT /products/:id */
export type ProductUpdatePayload = Partial<ProductCreatePayload> & { id: number };
