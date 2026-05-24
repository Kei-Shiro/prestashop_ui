/**
 * ProductOptionValue model — follows /product_option_values?schema=blank.
 * Represents a specific variant value like "Red" or "XL".
 */
import type { LangField } from './common';

/** Canonical ProductOptionValue model (= attribute value). */
export interface ProductOptionValue {
    id: string;
    /** ID of the parent ProductOption (attribute group) */
    id_attribute_group: string;
    color?: string;
    position?: string;
    /** Extracted from multilingual API field */
    name: string;
}

/** Payload for POST /product_option_values */
export interface ProductOptionValueCreatePayload {
    id_attribute_group: number;
    name: LangField;
    color?: string;
    position?: number;
}
