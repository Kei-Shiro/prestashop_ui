/**
 * OrderHistory model — follows /order_histories?schema=blank from the PrestaShop API.
 */

/** Canonical OrderHistory model. */
export interface OrderHistory {
    id: string;
    id_employee?: string;
    id_order_state?: string;
    id_order?: string;
    date_add?: string;
}

/** Payload for POST /order_histories (used to update order status). */
export interface OrderHistoryCreatePayload {
    id_order: number;
    id_order_state: number;
}
