/**
 * Supplier model — follows /suppliers?schema=blank from the PrestaShop API.
 */
import type { LangField } from './common';

/** Canonical Supplier model. */
export interface Supplier {
    id: string;
    link_rewrite?: string;
    name: string;
    active?: string;
    date_add?: string;
    date_upd?: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
}

/** Payload for POST /suppliers */
export interface SupplierCreatePayload {
    name: string;
    active: number;
    description?: LangField;
    meta_title?: LangField;
    meta_description?: LangField;
    meta_keywords?: LangField;
}
