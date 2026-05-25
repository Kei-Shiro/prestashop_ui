import { describe, it, expect, beforeEach, vi } from 'vitest';
import { catalogLoader } from './catalog-loader';
import apiService from '@shared/api/api-service';

vi.mock('@shared/api/api-service', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
        }
    };
});

describe('catalogLoader caching system', () => {
    beforeEach(() => {
        catalogLoader.clearAll();
        vi.clearAllMocks();
    });

    it('should register and cache product entries', async () => {
        const entry = { id_product: 42, prix_ttc: 12, id_tax_rules_group: 1, rate: 20, available_date: '' };
        catalogLoader.registerProduct('REF-42', entry);
        
        const res = await catalogLoader.getProductInfo('REF-42');
        expect(res).toEqual(entry);
    });

    it('should fetch and cache product info if not cached', async () => {
        const mockProduct = {
            id: '101',
            id_tax_rules_group: '1',
            price: '50.00',
            available_date: '2026-05-26',
        };
        
        // Mocking the get call for product lookup
        vi.mocked(apiService.get).mockResolvedValueOnce({
            prestashop: {
                products: {
                    product: [mockProduct]
                }
            }
        });

        // Register tax rate in taxRateCache
        catalogLoader.registerTaxRate(1, 20);

        const res = await catalogLoader.getProductInfo('REF-101');
        expect(res).not.toBeNull();
        expect(res?.id_product).toBe(101);
        // Price TTC: 50.00 * 1.20 = 60.00
        expect(res?.prix_ttc).toBe(60);
        expect(res?.available_date).toBe('2026-05-26');

        // Second lookup should use the cache (not calling get again)
        const cachedRes = await catalogLoader.getProductInfo('REF-101');
        expect(cachedRes).toEqual(res);
        expect(apiService.get).toHaveBeenCalledTimes(1);
    });

    it('should register and cache combination entries', async () => {
        const combo = {
            id: '505',
            id_product: '42',
            reference: 'REF-COMBO',
            price: '10.00',
        };
        catalogLoader.registerCombination(42, 'Rouge', combo);

        const res = await catalogLoader.getCombinationInfo(42, 'Rouge');
        expect(res).toEqual(combo);
    });

    it('should use runWithConcurrency to limit concurrent tasks', async () => {
        const items = [1, 2, 3, 4, 5];
        const active = new Set<number>();
        let maxConcurrent = 0;

        const results = await catalogLoader.runWithConcurrency(items, 2, async (item) => {
            active.add(item);
            maxConcurrent = Math.max(maxConcurrent, active.size);
            await new Promise(resolve => setTimeout(resolve, 10));
            active.delete(item);
            return item * 2;
        });

        expect(results).toEqual([2, 4, 6, 8, 10]);
        expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
});
