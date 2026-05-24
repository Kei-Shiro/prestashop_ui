/**
 * ProductFeatureValue model — follows /product_feature_values?schema=blank.
 * Represents a specific value for a feature like "Cotton" for "Material".
 */
import type { LangField } from './common';

/** Canonical ProductFeatureValue model. */
export interface ProductFeatureValue {
    id: string;
    id_feature: string;
    custom?: string;
    /** Extracted from multilingual API field */
    value: string;
}

export interface ProductFeatureValueCreatePayload {
    id_feature: number;
    custom?: number;
    value: LangField;
}
