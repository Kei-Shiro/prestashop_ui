/**
 * Cart & CartRow models — follows /carts?schema=blank from the PrestaShop API.
 */
import type { IdOnly } from './common';

/** A single row in a cart (association). */
export interface CartRow {
    id_product: number | string;
    id_product_attribute: number | string;
    id_address_delivery: number | string;
    id_customization?: number | string;
    quantity: number | string;
}

/** Canonical Cart model (raw from API + parsed). */
export interface Cart {
    id: string;
    id_address_delivery?: string;
    id_address_invoice?: string;
    id_currency?: string;
    id_customer?: string;
    id_guest?: string;
    id_lang?: string;
    id_shop_group?: string;
    id_shop?: string;
    id_carrier?: string;
    recyclable?: string;
    gift?: string;
    gift_message?: string;
    mobile_theme?: string;
    delivery_option?: string;
    secure_key?: string;
    allow_seperated_package?: string;
    date_add?: string;
    date_upd?: string;
    associations?: {
        cart_rows?: { cart_row: CartRow | CartRow[] };
    };
}

/** Payload for POST /carts */
export interface CartCreatePayload {
    id_customer: number;
    id_address_delivery: number;
    id_address_invoice: number;
    id_currency: number;
    id_lang: number;
    id_shop: number;
    id_shop_group: number;
    id_carrier: number;
    secure_key?: string;
    date_add?: string;
    date_upd?: string;
    associations?: {
        cart_rows: {
            cart_row: CartRow[];
        };
    };
}

/** Payload for PUT /carts/:id */
export interface CartUpdatePayload extends CartCreatePayload {
    id: number;
}
