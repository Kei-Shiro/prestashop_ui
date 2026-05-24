/**
 * ProductFeature model — follows /product_features?schema=blank.
 * Represents a product characteristic axis like "Material" or "Brand".
 */
import type { LangField } from './common';

/** Canonical ProductFeature model. */
export interface ProductFeature {
    id: string;
    position?: string;
    /** Extracted from multilingual API field */
    name: string;
}

export interface ProductFeatureCreatePayload {
    name: LangField;
    position?: number;
}
