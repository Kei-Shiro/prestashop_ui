/**
 * OrderState model — follows /order_states?schema=blank from the PrestaShop API.
 */
import type { LangField } from './common';

/** Canonical OrderState model. */
export interface OrderState {
    id: string;
    unremovable?: string;
    delivery?: string;
    hidden?: string;
    send_email?: string;
    module_name?: string;
    invoice?: string;
    color?: string;
    logable?: string;
    shipped?: string;
    paid?: string;
    pdf_delivery?: string;
    pdf_invoice?: string;
    deleted?: string;
    /** Extracted from multilingual API field */
    name: string;
    template?: string;
}

/** Payload for POST /order_states */
export interface OrderStateCreatePayload {
    name: LangField;
    color: string;
    send_email?: number;
    invoice?: number;
    logable?: number;
    shipped?: number;
    paid?: number;
    deleted?: number;
}
