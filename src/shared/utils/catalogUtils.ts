import { extractIdValue } from './extractIdValue';
import { extractLanguageValue } from './extractLanguageValue';
import { ensureArray } from './arrayUtils';

export interface AttributeGroupValue {
    id: string;
    name: string;
}

export interface AttributeGroup {
    id: string;
    name: string;
    values: AttributeGroupValue[];
}

export const DomainCatalogHelper = {
    /**
     * Transforms a list of raw PrestaShop option values into a lookup dictionary of id -> name.
     */
    buildOptionValueNamesMap(optionValues: any[]): Record<string, string> {
        const map: Record<string, string> = {};
        if (!optionValues) return map;
        
        optionValues.forEach((ov: any) => {
            const id = extractIdValue(ov.id);
            if (id) {
                map[id] = extractLanguageValue(ov.name);
            }
        });
        
        return map;
    },

    /**
     * Formats a combination's attribute values into a readable label (e.g. "M, Blue")
     * falling back to the reference or combination ID if names are empty.
     */
    buildCombinationLabel(combination: any, optionValueNamesMap: Record<string, string>): string {
        if (!combination) return '';
        
        const cId = extractIdValue(combination.id);
        const ovAssoc = combination.associations?.product_option_values?.product_option_value;
        const ovIds = ovAssoc ? ensureArray(ovAssoc).map((o: any) => extractIdValue(o)) : [];
        const names = ovIds.map((id: string) => optionValueNamesMap[id]).filter(Boolean);
        
        if (names.length > 0) {
            return names.join(', ');
        }
        
        return extractIdValue(combination.reference) || `#${cId}`;
    },

    /**
     * Extracts unique attributes and options from product combinations for use in detail select dropdowns.
     */
    extractAttributeGroups(
        combinations: any[],
        allOptionValues: any[],
        allOptions: any[]
    ): AttributeGroup[] {
        const usedValIds = new Set<string>();
        combinations.forEach(c => {
            const comboVals = c.associations?.product_option_values?.product_option_value;
            const vals = ensureArray(comboVals);
            vals.forEach((v: any) => {
                const vid = extractIdValue(v.id || v);
                if (vid) usedValIds.add(vid);
            });
        });

        const prodVals = allOptionValues.filter(v => usedValIds.has(extractIdValue(v.id)));
        const usedGroupIds = new Set(prodVals.map(v => extractIdValue(v.id_attribute_group)));
        
        return allOptions
            .filter(o => usedGroupIds.has(extractIdValue(o.id)))
            .map(o => ({
                id: extractIdValue(o.id),
                name: extractLanguageValue(o.name || o.public_name),
                values: prodVals
                    .filter(v => extractIdValue(v.id_attribute_group) === extractIdValue(o.id))
                    .map(v => ({
                        id: extractIdValue(v.id),
                        name: extractLanguageValue(v.name)
                    }))
            }));
    }
};
