/**
 * Order & OrderRow models — follows /orders?schema=blank from the PrestaShop API.
 */

/** A single row in an order (association). */
export interface OrderRow {
    id?: string;
    product_id: number | string;
    product_attribute_id: number | string;
    product_quantity: number | string;
    product_name?: string;
    product_reference?: string;
    product_ean13?: string;
    product_isbn?: string;
    product_upc?: string;
    product_price?: string;
    id_customization?: string;
    unit_price_tax_incl?: string;
    unit_price_tax_excl?: string;
}

/** Canonical Order model (raw from API). */
export interface Order {
    id: string;
    id_address_delivery?: string;
    id_address_invoice?: string;
    id_cart?: string;
    id_currency?: string;
    id_lang?: string;
    id_customer?: string;
    id_carrier?: string;
    current_state?: string;
    module?: string;
    invoice_number?: string;
    invoice_date?: string;
    delivery_number?: string;
    delivery_date?: string;
    valid?: string;
    date_add?: string;
    date_upd?: string;
    shipping_number?: string;
    note?: string;
    id_shop_group?: string;
    id_shop?: string;
    secure_key?: string;
    payment?: string;
    recyclable?: string;
    gift?: string;
    gift_message?: string;
    mobile_theme?: string;
    reference?: string;
    total_discounts?: string;
    total_discounts_tax_incl?: string;
    total_discounts_tax_excl?: string;
    total_paid?: string;
    total_paid_tax_incl?: string;
    total_paid_tax_excl?: string;
    total_paid_real?: string;
    total_products?: string;
    total_products_wt?: string;
    total_shipping?: string;
    total_shipping_tax_incl?: string;
    total_shipping_tax_excl?: string;
    carrier_tax_rate?: string;
    total_wrapping?: string;
    total_wrapping_tax_incl?: string;
    total_wrapping_tax_excl?: string;
    round_mode?: string;
    round_type?: string;
    conversion_rate?: string;
    associations?: {
        order_rows?: { order_row: OrderRow | OrderRow[] };
    };
}

/** Payload for POST /orders */
export interface OrderCreatePayload {
    id_shop: number;
    id_shop_group: number;
    id_address_delivery: number;
    id_address_invoice: number;
    id_cart: number;
    id_currency: number;
    id_lang: number;
    id_customer: number;
    id_carrier: number;
    current_state: number;
    module: string;
    payment: string;
    total_discounts: number;
    total_discounts_tax_incl: number;
    total_discounts_tax_excl: number;
    total_paid: number;
    total_paid_tax_incl: number;
    total_paid_tax_excl: number;
    total_paid_real: number;
    total_products: number;
    total_products_wt: number;
    total_shipping: number;
    total_shipping_tax_incl: number;
    total_shipping_tax_excl: number;
    total_wrapping: number;
    total_wrapping_tax_incl: number;
    total_wrapping_tax_excl: number;
    conversion_rate: number;
    valid: number;
    /** Optional: used by import pipeline to backdate orders */
    secure_key?: string;
    /** Optional: used by import pipeline to backdate orders */
    date_add?: string;
    associations: {
        order_rows: {
            order_row: Pick<OrderRow, 'product_id' | 'product_attribute_id' | 'product_quantity'>[];
        };
    };
}

