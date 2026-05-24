/**
 * Manufacturer model — follows /manufacturers?schema=blank from the PrestaShop API.
 */
import type { LangField, IdOnly } from './common';

/** Canonical Manufacturer model. */
export interface Manufacturer {
    id: string;
    active?: string;
    name: string;
    date_add?: string;
    date_upd?: string;
    description?: string;
    short_description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    associations?: {
        addresses?: { address: IdOnly | IdOnly[] };
    };
}

/** Payload for POST /manufacturers */
export interface ManufacturerCreatePayload {
    name: string;
    active: number;
    description?: LangField;
    short_description?: LangField;
    meta_title?: LangField;
    meta_description?: LangField;
    meta_keywords?: LangField;
}
