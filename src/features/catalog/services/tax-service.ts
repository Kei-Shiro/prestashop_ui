import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';

export interface TaxRate {
    id_tax_rules_group: string;
    rate: number;
}

const taxService = {
    async getTaxRates(): Promise<Map<string, number>> {
        try {
            const [rulesRes, taxesRes] = await Promise.all([
                apiService.get<any>('/tax_rules?display=[id_tax_rules_group,id_tax]'),
                apiService.get<any>('/taxes?display=[id,rate]')
            ]);

            const rules = rulesRes?.prestashop?.tax_rules?.tax_rule || [];
            const taxes = taxesRes?.prestashop?.taxes?.tax || [];

            const rulesList = ensureArray(rules);
            const taxesList = ensureArray(taxes);

            const taxMap = new Map<string, number>();
            taxesList.forEach((t: any) => {
                taxMap.set(extractIdValue(t.id), parseFloat(t.rate || '0'));
            });

            const rateMap = new Map<string, number>();
            rulesList.forEach((r: any) => {
                const groupId = extractIdValue(r.id_tax_rules_group);
                const taxId = extractIdValue(r.id_tax);
                if (groupId && taxId && taxMap.has(taxId)) {
                    // For simplicity, we take the first tax rate found for the group
                    // In real PS, it depends on country/state, but here we assume single country
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
