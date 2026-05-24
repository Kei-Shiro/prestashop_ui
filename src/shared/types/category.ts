/**
 * Category model — follows /categories?schema=blank from the PrestaShop API.
 */
import type { LangField, IdOnly } from './common';

/** Canonical Category model. */
export interface Category {
    id: string;
    id_parent?: string;
    active?: string;
    id_shop_default?: string;
    is_root_category?: string;
    position?: string;
    date_add?: string;
    date_upd?: string;
    /** Extracted from multilingual API field */
    name: string;
    link_rewrite?: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    associations?: {
        categories?: { category: IdOnly | IdOnly[] };
        products?: { product: IdOnly | IdOnly[] };
    };
}

/** Payload for POST /categories */
export interface CategoryCreatePayload {
    name: LangField;
    link_rewrite: LangField;
    active: number;
    /** Parent category id (2 = Home) */
    id_parent: number;
}

export type CategoryUpdatePayload = Partial<CategoryCreatePayload> & { id: number };
