/**
 * TaxRuleGroup model — follows /tax_rule_groups?schema=blank from the PrestaShop API.
 * A group of tax rules that can be assigned to a product.
 */

/** Canonical TaxRuleGroup model. */
export interface TaxRuleGroup {
    id: string;
    name: string;
    active?: string;
    deleted?: string;
    date_add?: string;
    date_upd?: string;
}

/** Payload for POST /tax_rule_groups */
export interface TaxRuleGroupCreatePayload {
    active: number;
    name: string;
}
