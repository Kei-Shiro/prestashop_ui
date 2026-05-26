import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { withLoading } from '@shared/utils/asyncUtils';
import { toPrestashopDate } from '@shared/utils/dateUtils';
import { DomainCatalogHelper } from '@shared/utils/catalogUtils';
import type { StockMovement, StockMovementDisplay } from '@shared/types/stock-movement';
import type { StockAvailable } from '@shared/types/stock-available';

// Re-export canonical types for consumers
export type { StockMovement, StockMovementDisplay } from '@shared/types/stock-movement';
export type { StockAvailable } from '@shared/types/stock-available';

export const useStockStore = defineStore('stock', () => {
    const stockMovements = ref<StockMovementDisplay[]>([]);
    const loading = ref(false);

    const fetchStockMovements = async () => {
        await withLoading(loading, async () => {
            const response = await apiService.get<any>('/stock_movements?display=full');

            const pStock = response?.prestashop?.stock_mvts?.stock_mvt ||
                           response?.prestashop?.stock_movements?.stock_movement;

            if (!pStock) {
                stockMovements.value = [];
                console.log('[stockStore] Aucun mouvement trouvé dans le XML.', response);
                return;
            }

            const rawMovements = ensureArray(pStock);

            // Resolve stock_available IDs → product + attribute
            const uniqueStockAvailableIds = [...new Set(
                rawMovements.map((m: any) => extractIdValue(m.id_stock)).filter(Boolean)
            )];

            const stockAvailableMap: Record<string, { id_product: string; id_product_attribute: string }> = {};

            if (uniqueStockAvailableIds.length > 0) {
                try {
                    const filterIds = uniqueStockAvailableIds.join('|');
                    const saResponse = await apiService.get<any>(
                        `/stock_availables?filter[id]=[${filterIds}]&display=[id,id_product,id_product_attribute]`
                    );
                    const saArray = ensureArray(saResponse?.prestashop?.stock_availables?.stock_available) as StockAvailable[];
                    for (const sa of saArray) {
                        const saId = extractIdValue(sa.id);
                        if (saId) {
                            stockAvailableMap[saId] = {
                                id_product: extractIdValue(sa.id_product),
                                id_product_attribute: extractIdValue(sa.id_product_attribute),
                            };
                        }
                    }
                } catch (e) {
                    console.warn('[stockStore] Impossible de résoudre les stock_availables', e);
                }
            }

            // Resolve combination names
            const uniqueProductIds = [...new Set(
                Object.values(stockAvailableMap).map(sa => sa.id_product).filter(Boolean)
            )];

            const combinationMap: Record<string, string> = {};
            const productCombinationsMap: Record<string, string[]> = {};

            if (uniqueProductIds.length > 0) {
                try {
                    const [combiResponse, ovResponse] = await Promise.all([
                        apiService.get<any>(`/combinations?filter[id_product]=[${uniqueProductIds.join('|')}]&display=full`),
                        apiService.get<any>('/product_option_values?display=full'),
                    ]);

                    const optionValueNames = DomainCatalogHelper.buildOptionValueNamesMap(
                        ensureArray(ovResponse?.prestashop?.product_option_values?.product_option_value)
                    );

                    ensureArray(combiResponse?.prestashop?.combinations?.combination).forEach((c: any) => {
                        const cId = extractIdValue(c.id);
                        const cProductId = extractIdValue(c.id_product);
                        const label = DomainCatalogHelper.buildCombinationLabel(c, optionValueNames);
                        if (cId) {
                            combinationMap[cId] = label;
                            if (cProductId) {
                                if (!productCombinationsMap[cProductId]) productCombinationsMap[cProductId] = [];
                                productCombinationsMap[cProductId].push(cId);
                            }
                        }
                    });
                } catch (e) {
                    console.warn('[stockStore] Impossible de résoudre les déclinaisons', e);
                }
            }

            stockMovements.value = rawMovements.map((m: any): StockMovementDisplay => {
                const saId = extractIdValue(m.id_stock);
                const saInfo = stockAvailableMap[saId];
                const productId = saInfo?.id_product || extractIdValue(m.id_product) || '';
                const combiId = saInfo?.id_product_attribute && saInfo.id_product_attribute !== '0'
                    ? saInfo.id_product_attribute : '';

                let combination_name = '';
                if (combiId) {
                    combination_name = combinationMap[combiId] || '';
                } else {
                    const combiIds = productCombinationsMap[productId] || [];
                    if (combiIds.length === 1) combination_name = combinationMap[combiIds[0]] || '';
                }

                return {
                    id_stock_mvt: extractIdValue(m['@_id'] ?? m.id) || undefined,
                    id_stock: saId,
                    id_product: productId,
                    id_product_attribute: combiId || undefined,
                    combination_name: combination_name || undefined,
                    sign: Number(extractIdValue(m.sign)),
                    physical_quantity: Number(extractIdValue(m.physical_quantity)),
                    date_add: String(extractIdValue(m.date_add)).trim(),
                };
            });

            console.log(`[stockStore] ${stockMovements.value.length} mouvements récupérés.`);
        });
    };

    const addStock = async (id_product: string, delta: number, id_product_attribute = '0') => {
        await withLoading(loading, async () => {
            const stockGetRes = await apiService.get<any>(
                `/stock_availables?filter[id_product]=${id_product}&filter[id_product_attribute]=${id_product_attribute}&display=[id,quantity]`
            );
            const stockAvailable = ensureArray(stockGetRes?.prestashop?.stock_availables?.stock_available)[0];

            if (!stockAvailable || !stockAvailable.id) throw new Error('ID Stock non trouvé');

            const idStockAvailable = extractIdValue(stockAvailable.id);
            const currentQty = parseInt(extractIdValue(stockAvailable.quantity) || '0', 10);
            const newQty = currentQty + delta;

            // 1. Mettre à jour la quantité physique dans stock_availables
            const patchData = { id: Number(idStockAvailable), quantity: newQty };
            await apiService.patch(`/stock_availables/${idStockAvailable}`, { stock_available: patchData });

            // 2. Créer le mouvement de stock historique
            const payload: { stock_mvt: StockMovement } = {
                stock_mvt: {
                    id_employee: 1,
                    id_stock: Number(idStockAvailable),
                    physical_quantity: Math.abs(delta),
                    sign: delta > 0 ? 1 : -1,
                    id_stock_mvt_reason: 1,
                    price_te: 0,
                    date_add: toPrestashopDate(new Date()),
                }
            };

            await apiService.post('/stock_movements', payload);
            console.log(`[stockStore] Stock mis à jour : ${delta > 0 ? '+' : ''}${delta} (nouvelle qté: ${newQty}) pour produit ${id_product} (déclinaison ${id_product_attribute})`);
            await fetchStockMovements();
        });
    };

    const lastRemovalReport = ref<any>(null);

    const removeStockForCategory = async (categoryId: string, categoryName: string, quantityToRemove: number) => {
        await withLoading(loading, async () => {
            // 1. Fetch all products (limit 200 to cover all)
            const productsRes = await apiService.get<any>('/products?display=full&limit=200');
            const productsList = ensureArray(productsRes?.prestashop?.products?.product);

            // 2. Filter products that belong to the category
            const matchingProducts = productsList.filter((p: any) => {
                const defaultCat = extractIdValue(p.id_category_default);
                const categoriesAssoc = p.associations?.categories?.category;
                const productCats = ensureArray(categoriesAssoc).map((c: any) => extractIdValue(c));
                
                return defaultCat === categoryId || productCats.includes(categoryId);
            });

            if (matchingProducts.length === 0) {
                lastRemovalReport.value = {
                    categoryName,
                    requestedQty: quantityToRemove,
                    totalRequested: 0,
                    totalActuallyRemoved: 0,
                    items: []
                };
                return;
            }

            // 3. For each matching product, process stock_availables
            const reportItems: any[] = [];
            let totalRequested = 0;
            let totalActuallyRemoved = 0;

            // Fetch option values map first so we can format combinations labels
            const ovResponse = await apiService.get<any>('/product_option_values?display=full');
            const optionValueNames = DomainCatalogHelper.buildOptionValueNamesMap(
                ensureArray(ovResponse?.prestashop?.product_option_values?.product_option_value)
            );

            for (const p of matchingProducts) {
                const pid = extractIdValue(p.id);
                const pName = extractLanguageValue(p.name);
                const pRef = p.reference || '';

                // Fetch combinations for this product to map combinations labels later
                const combiResponse = await apiService.get<any>(`/combinations?filter[id_product]=${pid}&display=full`);
                const combinationList = ensureArray(combiResponse?.prestashop?.combinations?.combination);
                const combinationMap: Record<string, string> = {};
                combinationList.forEach((c: any) => {
                    const cId = extractIdValue(c.id);
                    const label = DomainCatalogHelper.buildCombinationLabel(c, optionValueNames);
                    if (cId) combinationMap[cId] = label;
                });

                // Fetch all stock_availables for this product
                const stockGetRes = await apiService.get<any>(
                    `/stock_availables?filter[id_product]=${pid}&display=[id,id_product_attribute,quantity]`
                );
                const stockAvailables = ensureArray(stockGetRes?.prestashop?.stock_availables?.stock_available);

                // Check if this product has combinations
                const combinationStocks = stockAvailables.filter(sa => {
                    const attrId = extractIdValue(sa.id_product_attribute);
                    return attrId && attrId !== '0';
                });

                const mainStockRow = stockAvailables.find(sa => {
                    const attrId = extractIdValue(sa.id_product_attribute);
                    return !attrId || attrId === '0';
                });

                if (combinationStocks.length > 0) {
                    // Has combinations: update each combination separately
                    let newTotalQty = 0;
                    for (const sa of combinationStocks) {
                        const saId = extractIdValue(sa.id);
                        const attrId = extractIdValue(sa.id_product_attribute);
                        const currentQty = parseInt(extractIdValue(sa.quantity) || '0', 10);
                        
                        const requested = quantityToRemove;
                        const removed = Math.min(requested, currentQty);
                        const finalQty = currentQty - removed;

                        totalRequested += requested;
                        totalActuallyRemoved += removed;
                        newTotalQty += finalQty;

                        if (removed > 0) {
                            // Update this combination's stock_available
                            const patchData = { id: Number(saId), quantity: finalQty };
                            await apiService.patch(`/stock_availables/${saId}`, { stock_available: patchData });

                            // Create stock movement
                            const payload = {
                                stock_mvt: {
                                    id_employee: 1,
                                    id_stock: Number(saId),
                                    physical_quantity: removed,
                                    sign: -1,
                                    id_stock_mvt_reason: 1,
                                    price_te: 0,
                                    date_add: toPrestashopDate(new Date()),
                                }
                            };
                            await apiService.post('/stock_movements', payload);
                        }

                        reportItems.push({
                            productName: pName,
                            reference: pRef,
                            combinationName: combinationMap[attrId] || `#${attrId}`,
                            initialStock: currentQty,
                            requestedToRemove: requested,
                            actuallyRemoved: removed,
                            finalStock: finalQty
                        });
                    }

                    // Update main stock row (id_product_attribute = 0) with sum of combinations
                    if (mainStockRow) {
                        const mainSaId = extractIdValue(mainStockRow.id);
                        const patchData = { id: Number(mainSaId), quantity: newTotalQty };
                        await apiService.patch(`/stock_availables/${mainSaId}`, { stock_available: patchData });
                    }
                } else if (mainStockRow) {
                    // No combinations: update main product stock row directly
                    const saId = extractIdValue(mainStockRow.id);
                    const currentQty = parseInt(extractIdValue(mainStockRow.quantity) || '0', 10);

                    const requested = quantityToRemove;
                    const removed = Math.min(requested, currentQty);
                    const finalQty = currentQty - removed;

                    totalRequested += requested;
                    totalActuallyRemoved += removed;

                    if (removed > 0) {
                        // Update stock_available
                        const patchData = { id: Number(saId), quantity: finalQty };
                        await apiService.patch(`/stock_availables/${saId}`, { stock_available: patchData });

                        // Create stock movement
                        const payload = {
                            stock_mvt: {
                                id_employee: 1,
                                id_stock: Number(saId),
                                physical_quantity: removed,
                                sign: -1,
                                id_stock_mvt_reason: 1,
                                price_te: 0,
                                date_add: toPrestashopDate(new Date()),
                            }
                        };
                        await apiService.post('/stock_movements', payload);
                    }

                    reportItems.push({
                        productName: pName,
                        reference: pRef,
                        combinationName: '',
                        initialStock: currentQty,
                        requestedToRemove: requested,
                        actuallyRemoved: removed,
                        finalStock: finalQty
                    });
                }
            }

            // Save report
            lastRemovalReport.value = {
                categoryName,
                requestedQty: quantityToRemove,
                totalRequested,
                totalActuallyRemoved,
                items: reportItems
            };

            await fetchStockMovements();
        });
    };

    return { stockMovements, loading, fetchStockMovements, addStock, lastRemovalReport, removeStockForCategory };
});

export default useStockStore;
