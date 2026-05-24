/**
 * ProductOption model — follows /product_options?schema=blank (attribute groups).
 * Represents a variant axis like "Color" or "Size".
 */
import type { LangField, IdOnly } from './common';

/** Canonical ProductOption model (= attribute group). */
export interface ProductOption {
    id: string;
    is_color_group?: string;
    group_type?: string;
    position?: string;
    /** Extracted from multilingual API field */
    name: string;
    /** Extracted from multilingual API field */
    public_name?: string;
    associations?: {
        product_option_values?: { product_option_value: IdOnly | IdOnly[] };
    };
}

/** Payload for POST /product_options */
export interface ProductOptionCreatePayload {
    /** e.g. 'select', 'color', 'radio' */
    group_type: string;
    name: LangField;
    public_name: LangField;
}
