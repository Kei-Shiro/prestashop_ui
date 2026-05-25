import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import type { ProductMapEntry } from '@shared/types/import';
import type { Combination } from '@shared/types/combination';

// Caches en mémoire
const productCache = new Map<string, ProductMapEntry>();
const combinationCache = new Map<string, Combination>();
const taxRateCache = new Map<number, number>();
const stockAvailableCache = new Map<string, { id: number; quantity: number }>();
const negativeCombinationCache = new Set<string>();

export const catalogLoader = {
    registerProduct(reference: string, entry: ProductMapEntry) {
        productCache.set(reference, entry);
    },
    
    registerCombination(productId: number, valeur: string, combo: Combination) {
        const cacheKey = `${productId}_${valeur}`;
        combinationCache.set(cacheKey, combo);
    },
    
    registerTaxRate(idTaxRulesGroup: number, rate: number) {
        taxRateCache.set(idTaxRulesGroup, rate);
    },
    
    clearProductCache() { 
        productCache.clear(); 
        taxRateCache.clear();
    },
    
    clearCombinationCache() { 
        combinationCache.clear(); 
        negativeCombinationCache.clear();
        stockAvailableCache.clear();
    },
    
    clearAll() { 
        productCache.clear(); 
        combinationCache.clear(); 
        taxRateCache.clear();
        stockAvailableCache.clear();
        negativeCombinationCache.clear();
    },

    // --- Helpers de Préchargement en Bloc (Warm Cache Pattern) ---
    
    async preloadProductCache(): Promise<void> {
        this.clearProductCache();
        try {
            const [taxesRes, groupsRes] = await Promise.all([
                apiService.get<any>('/taxes?display=full'),
                apiService.get<any>('/tax_rule_groups?display=full')
            ]);
            const taxes = ensureArray(taxesRes?.prestashop?.taxes?.tax);
            const groups = ensureArray(groupsRes?.prestashop?.tax_rule_groups?.tax_rule_group);

            const taxRateById = new Map<number, number>();
            for (const t of taxes) {
                const taxId = parseInt(extractIdValue(t.id) || '0', 10);
                const rate = parseFloat(extractIdValue(t.rate) || '0');
                if (taxId) {
                    taxRateById.set(taxId, rate);
                }
            }

            const groupRates = new Map<number, number>();
            for (const g of groups) {
                const gId = parseInt(extractIdValue(g.id) || '0', 10);
                const name = extractIdValue(g.name) || '';
                const match = name.match(/Group\s+([\d.]+)\s*%/);
                if (match && gId) {
                    groupRates.set(gId, parseFloat(match[1]));
                    taxRateCache.set(gId, parseFloat(match[1]));
                } else if (gId) {
                    // Fallback to rules check
                    // For simplicity, default to 20 or check if we can guess from name
                    groupRates.set(gId, 20);
                    taxRateCache.set(gId, 20);
                }
            }

            const existing = await apiService.get<any>(
                '/products?display=[id,reference,id_tax_rules_group,price,available_date]'
            );
            const products = ensureArray(existing?.prestashop?.products?.product);

            for (const p of products) {
                const ref = (extractIdValue(p.reference) || '').trim();
                const idVal = extractIdValue(p.id);
                if (ref && idVal) {
                    const idProduct = parseInt(idVal, 10);
                    const idTaxGroup = parseInt(extractIdValue(p.id_tax_rules_group) || '1', 10);
                    const rate = groupRates.get(idTaxGroup) || 20;
                    const priceHt = parseFloat(p.price || '0');
                    const priceTtc = priceHt * (1 + rate / 100);

                    productCache.set(ref, {
                        id_product: idProduct,
                        prix_ttc: priceTtc,
                        id_tax_rules_group: idTaxGroup,
                        rate,
                        available_date: extractIdValue(p.available_date) || ''
                    });
                }
            }
            console.log(`[catalogLoader] Preloaded ${productCache.size} products.`);
        } catch (err) {
            console.error("[catalogLoader] Failed to preload product cache:", err);
        }
    },

    async preloadStockCache(): Promise<void> {
        stockAvailableCache.clear();
        try {
            const res = await apiService.get<any>('/stock_availables?display=[id,id_product,id_product_attribute,quantity]');
            const stocks = ensureArray(res?.prestashop?.stock_availables?.stock_available);
            for (const s of stocks) {
                const idVal = extractIdValue(s.id);
                const prodId = extractIdValue(s.id_product);
                const attrId = extractIdValue(s.id_product_attribute) || '0';
                const qty = parseInt(extractIdValue(s.quantity) || '0', 10);
                if (idVal && prodId) {
                    stockAvailableCache.set(`${prodId}_${attrId}`, { id: parseInt(idVal, 10), quantity: qty });
                }
            }
            console.log(`[catalogLoader] Preloaded ${stockAvailableCache.size} stock available records.`);
        } catch (err) {
            console.error("[catalogLoader] Failed to preload stock cache:", err);
        }
    },

    // --- Méthodes d'accès unitaires sécurisées (Fallbacks) ---
    
    async getProductInfo(reference: string): Promise<ProductMapEntry | null> {
        const cached = productCache.get(reference);
        if (cached) return cached;

        try {
            const existing = await apiService.get<any>(
                `/products?filter[reference]=${encodeURIComponent(reference)}&display=full`
            );
            const found = ensureArray(existing?.prestashop?.products?.product)[0];
            const idVal = extractIdValue(found?.id);
            if (idVal) {
                const idProduct = parseInt(idVal, 10);
                const idTaxGroup = parseInt(extractIdValue(found.id_tax_rules_group) || '1', 10);
                
                let rate = taxRateCache.get(idTaxGroup) ?? 20;
                if (!taxRateCache.has(idTaxGroup)) {
                    try {
                        const taxRulesRes = await apiService.get<any>(`/tax_rules?filter[id_tax_rules_group]=${idTaxGroup}&display=full`);
                        const firstRule = ensureArray(taxRulesRes?.prestashop?.tax_rules?.tax_rule)[0];
                        if (firstRule) {
                            const taxId = extractIdValue(firstRule.id_tax);
                            const taxRes = await apiService.get<any>(`/taxes/${taxId}`);
                            rate = parseFloat(extractIdValue(taxRes?.prestashop?.tax?.rate) || '20');
                            taxRateCache.set(idTaxGroup, rate);
                        }
                    } catch (_) {}
                }
                
                const priceHt = parseFloat(found.price || '0');
                const priceTtc = priceHt * (1 + rate / 100);

                const entry: ProductMapEntry = {
                    id_product: idProduct,
                    prix_ttc: priceTtc,
                    id_tax_rules_group: idTaxGroup,
                    rate: rate,
                    available_date: extractIdValue(found.available_date) || ''
                };
                productCache.set(reference, entry);
                return entry;
            }
        } catch (e) {
            console.error(`[catalogLoader] Failed dynamic lookup for product reference ${reference}:`, e);
        }
        return null;
    },

    async getCombinationInfo(productId: number, valeur: string): Promise<Combination | null> {
        const cacheKey = `${productId}_${valeur}`;
        
        const cached = combinationCache.get(cacheKey);
        if (cached) return cached;

        if (negativeCombinationCache.has(cacheKey)) return null;

        try {
            const existing = await apiService.get<any>(
                `/combinations?filter[id_product]=${productId}&display=full`
            );
            const combosArr = ensureArray(existing?.prestashop?.combinations?.combination);
            
            const ovResponse = await apiService.get<any>(
                `/product_option_values?filter[name]=${encodeURIComponent(valeur)}&display=full`
            );
            const foundVals = ensureArray(ovResponse?.prestashop?.product_option_values?.product_option_value);
            
            if (foundVals.length > 0) {
                const valIds = foundVals.map(fv => Number(extractIdValue(fv.id)));
                
                for (const combo of combosArr) {
                    const associations = combo.associations?.product_option_values?.product_option_value;
                    const assocArr = ensureArray(associations);
                    if (assocArr.some((a: any) => valIds.includes(Number(extractIdValue(a.id))))) {
                        const mappedCombo: Combination = {
                            id: extractIdValue(combo.id),
                            id_product: String(productId),
                            reference: combo.reference || undefined,
                            price: combo.price || undefined,
                            wholesale_price: combo.wholesale_price || undefined,
                            associations: combo.associations
                        };
                        combinationCache.set(cacheKey, mappedCombo);
                        return mappedCombo;
                    }
                }
            }
        } catch (e) {
            console.error(`[catalogLoader] Failed dynamic lookup for combination (productId: ${productId}, valeur: ${valeur}):`, e);
        }

        // Store in negative cache
        negativeCombinationCache.add(cacheKey);
        return null;
    },

    getCachedStock(productId: number, attributeId: number): { id: number; quantity: number } | null {
        return stockAvailableCache.get(`${productId}_${attributeId}`) ?? null;
    },

    // --- Limiteur de Concurrence ---
    
    async runWithConcurrency<T, R>(
        items: T[],
        limit: number,
        fn: (item: T) => Promise<R>
    ): Promise<R[]> {
        const results: Promise<R>[] = [];
        const executing: Promise<any>[] = [];
        for (const item of items) {
            const p = Promise.resolve().then(() => fn(item));
            results.push(p);
            if (limit <= items.length) {
                const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= limit) {
                    await Promise.race(executing);
                }
            }
        }
        return Promise.all(results);
    }
};
