/**
 * Tax model — follows /taxes?schema=blank from the PrestaShop API.
 */
import type { LangField } from './common';

/** Canonical Tax model. */
export interface Tax {
    id: string;
    rate: string;
    active?: string;
    deleted?: string;
    /** Extracted from multilingual API field */
    name: string;
}

/** Payload for POST /taxes */
export interface TaxCreatePayload {
    active: number;
    name: LangField;
    rate: number;
}
