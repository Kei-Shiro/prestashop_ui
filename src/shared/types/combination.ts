/**
 * Combination (product variant/declination) model.
 * Follows /combinations?schema=blank from the PrestaShop API.
 */
import type { LangField, IdOnly } from './common';

/** Canonical Combination model. */
export interface Combination {
    id: string;
    /** API field: id_product (IdRef raw, string after extraction) */
    id_product: string;
    ean13?: string;
    isbn?: string;
    upc?: string;
    mpn?: string;
    reference?: string;
    supplier_reference?: string;
    wholesale_price?: string;
    /** Price impact (delta from base product price) */
    price?: string;
    ecotax?: string;
    weight?: string;
    unit_price_impact?: string;
    minimal_quantity?: string;
    low_stock_threshold?: string;
    low_stock_alert?: string;
    /** '1' if this is the default combination */
    default_on?: string;
    available_date?: string;
    available_now?: string;
    available_later?: string;
    associations?: {
        product_option_values?: { product_option_value: IdOnly | IdOnly[] };
        images?: { image: IdOnly | IdOnly[] };
    };
}

/** Payload for POST /combinations */
export interface CombinationCreatePayload {
    id_product: number;
    reference: string;
    /** Price impact delta */
    price: number;
    minimal_quantity: number;
    associations: {
        product_option_values: {
            product_option_value: Array<{ id: number }>;
        };
    };
}

export type CombinationUpdatePayload = Partial<CombinationCreatePayload> & { id: number };
