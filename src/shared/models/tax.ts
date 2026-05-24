import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import type { Tax } from '@shared/types/tax';
import type { TaxRule } from '@shared/types/tax-rule';
import type { TaxRuleGroup } from '@shared/types/tax-rule-group';

// Re-export canonical types for consumers
export type { Tax } from '@shared/types/tax';
export type { TaxRule } from '@shared/types/tax-rule';
export type { TaxRuleGroup } from '@shared/types/tax-rule-group';

export const taxService = {
    /**
     * Returns a map of tax_rule_group_id → rate (%)
     * used to calculate TTC prices in productService.
     */
    async getTaxRates(): Promise<Map<string, number>> {
        try {
            const [rulesRes, taxesRes] = await Promise.all([
                apiService.get<any>('/tax_rules?display=[id_tax_rules_group,id_tax]'),
                apiService.get<any>('/taxes?display=[id,rate]')
            ]);

            const rulesList = ensureArray(rulesRes?.prestashop?.tax_rules?.tax_rule) as TaxRule[];
            const taxesList = ensureArray(taxesRes?.prestashop?.taxes?.tax) as Tax[];

            const taxMap = new Map<string, number>();
            taxesList.forEach(t => {
                taxMap.set(extractIdValue(t.id), parseFloat(t.rate || '0'));
            });

            const rateMap = new Map<string, number>();
            rulesList.forEach(r => {
                const groupId = extractIdValue(r.id_tax_rules_group);
                const taxId = extractIdValue(r.id_tax);
                if (groupId && taxId && taxMap.has(taxId)) {
                    rateMap.set(groupId, taxMap.get(taxId)!);
                }
            });

            return rateMap;
        } catch (error) {
            console.error('Error fetching tax rates:', error);
            return new Map();
        }
    }
};

export default taxService;
