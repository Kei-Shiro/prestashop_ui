/**
 * StockMovement model — follows /stock_movements?schema=blank from the PrestaShop API.
 * The API resource name is `stock_mvt`.
 */

/**
 * Canonical StockMovement model (API field names).
 * Used for both POST payload and GET response.
 */
export interface StockMovement {
    id?: string;
    id_product?: string;
    id_product_attribute?: string;
    id_warehouse?: string;
    id_currency?: string;
    management_type?: string;
    id_employee: number;
    id_stock: number;
    id_stock_mvt_reason: number;
    id_order?: string;
    id_supply_order?: string;
    product_name?: string;
    ean13?: string;
    upc?: string;
    reference?: string;
    mpn?: string;
    physical_quantity: number;
    /** 1 = stock in (purchase/reception), -1 = stock out (sale/loss) */
    sign: number;
    last_wa?: string;
    current_wa?: string;
    price_te?: number;
    date_add: string;
}

/**
 * UI-friendly display model for stock movements.
 * Enriched by the stockStore with product/combination resolution.
 */
export interface StockMovementDisplay {
    id_stock_mvt?: string;
    id_stock: string;
    id_product: string;
    id_product_attribute?: string;
    combination_name?: string;
    sign: number;
    physical_quantity: number;
    date_add: string;
}
