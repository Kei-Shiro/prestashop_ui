/**
 * TaxRule model — follows /tax_rules?schema=blank from the PrestaShop API.
 * Associates a tax rate group with a specific tax for a country.
 */

/** Canonical TaxRule model. */
export interface TaxRule {
    id: string;
    id_tax_rules_group: string;
    id_state?: string;
    id_country?: string;
    zipcode_from?: string;
    zipcode_to?: string;
    id_tax: string;
    behavior?: string;
    description?: string;
}

/** Payload for POST /tax_rules */
export interface TaxRuleCreatePayload {
    id_tax: number;
    id_tax_rules_group: number;
    /** Country id (e.g. 8 = France) */
    id_country: number;
    id_state?: number;
    behavior?: number;
}
