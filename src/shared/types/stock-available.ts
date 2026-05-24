/**
 * StockAvailable model — used for /stock_availables endpoint.
 * Tracks available quantity per product/combination per shop.
 */

/** Canonical StockAvailable model. */
export interface StockAvailable {
    id: string;
    id_product: string;
    id_product_attribute: string;
    id_shop?: string;
    id_shop_group?: string;
    quantity: string;
    depends_on_stock?: string;
    out_of_stock?: string;
    location?: string;
}

/** Payload for PUT /stock_availables/:id (partial update supported). */
export interface StockAvailableUpdatePayload {
    id: number;
    quantity: number;
    id_product?: number;
    id_product_attribute?: number;
    id_shop?: number;
    id_shop_group?: number;
    depends_on_stock?: number;
    out_of_stock?: number;
}
