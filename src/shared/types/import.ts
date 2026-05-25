/**
 * Import-specific types — CSV row structures and intermediate resolution models
 * used only by the inventory import pipeline.
 *
 * API payload types (ProductCreatePayload, CombinationCreatePayload, etc.)
 * have been moved to src/shared/types/ — import them from '@shared/types'.
 */

// Re-export LangField for convenience in import services
export type { LangField } from './common';

// ─── CSV Row Types ────────────────────────────────────────────────────────────

/** CSV1 — Product import row */
export interface ProductCSVRow {
    date_availability: string;
    produit: string;
    reference: string;
    prix_ttc: string;
    Taxe: string;
    categorie: string;
    prix_achat: string;
}

/** CSV2 — Stock / combination import row */
export interface StockCSVRow {
    reference: string;
    specificite: string;
    valeur: string;
    stock_initial: string;
    prix_vente_ttc: string;
    date_add?: string;
}

/** CSV3 — Order import row */
export interface OrderCSVRow {
    date: string;
    nom: string;
    email: string;
    pwd: string;
    adresse: string;
    achat: string;
    etat: string;
}

// ─── Intermediate Resolution Types ───────────────────────────────────────────

/** A parsed (reference, qty, variant) tuple from an order CSV row */
export interface AchatTuple {
    ref: string;
    qty: number;
    valeur: string;
}

/** A resolved cart item with PS IDs and pricing */
export interface ResolvedTuple {
    id_product: number;
    id_product_attribute: number;
    quantity: number;
    unit_price_ttc: number;
    rate: number;
}

/** Product lookup entry built during import for pricing resolution */
export interface ProductMapEntry {
    id_product: number;
    prix_ttc: number;
    id_tax_rules_group: number;
    rate: number;
    available_date: string;
}

/** Combination lookup entry built during import */
export interface CombinationMapEntry {
    id: number;
    prix_ttc: number;
}