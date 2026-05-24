/**
 * Carrier model — follows /carriers?schema=blank from the PrestaShop API.
 */
import type { LangField } from './common';

/** Canonical Carrier model. */
export interface Carrier {
    id: string;
    deleted?: string;
    is_module?: string;
    id_tax_rules_group?: string;
    id_reference?: string;
    name: string;
    active?: string;
    is_free?: string;
    url?: string;
    shipping_handling?: string;
    shipping_external?: string;
    range_behavior?: string;
    shipping_method?: string;
    max_width?: string;
    max_height?: string;
    max_depth?: string;
    max_weight?: string;
    grade?: string;
    external_module_name?: string;
    need_range?: string;
    position?: string;
    /** Multilingual delivery delay label */
    delay?: string;
}

/** Payload for POST /carriers */
export interface CarrierCreatePayload {
    name: string;
    active: number;
    deleted: number;
    is_free: number;
    shipping_handling: number;
    shipping_external: number;
    range_behavior: number;
    shipping_method: number;
    max_width: number;
    max_height: number;
    max_depth: number;
    max_weight: number;
    grade: number;
    delay: LangField;
}
