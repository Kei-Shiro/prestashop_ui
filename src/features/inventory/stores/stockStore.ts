import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import type { StockMovement as StockMovementPayload, StockMovementDisplay } from '@shared/types/import';

export type { StockMovementDisplay };

export const useStockStore = defineStore('stock', () => {
  const stockMovements = ref<StockMovementDisplay[]>([]);
  const loading = ref(false);

  const fetchStockMovements = async () => {
    loading.value = true;
    try {
      const response: any = await apiService.get('/stock_movements?display=full');
      
      const pStock = response?.prestashop?.stock_mvts?.stock_mvt ||
                     response?.prestashop?.stock_movements?.stock_movement;

      if (pStock) {
        const rawMovements: any[] = Array.isArray(pStock) ? pStock : [pStock];

        const uniqueStockAvailableIds = [...new Set(
          rawMovements.map((m: any) => extractIdValue(m.id_stock)).filter(Boolean)
        )];

        const stockAvailableMap: Record<string, { id_product: string; id_product_attribute: string }> = {};

        if (uniqueStockAvailableIds.length > 0) {
          try {
            const filterIds = uniqueStockAvailableIds.join('|');
            const saResponse: any = await apiService.get(
              `/stock_availables?filter[id]=[${filterIds}]&display=[id,id_product,id_product_attribute]`
            );
            const saItems = saResponse?.prestashop?.stock_availables?.stock_available;
            const saArray = saItems ? (Array.isArray(saItems) ? saItems : [saItems]) : [];
            for (const sa of saArray) {
              const saId = extractIdValue(sa.id) || (sa['@_id'] != null ? String(sa['@_id']) : '');
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

        const uniqueProductIds = [...new Set(
          Object.values(stockAvailableMap).map((sa) => sa.id_product).filter(Boolean)
        )];

        const combinationMap: Record<string, string> = {};
        const productCombinationsMap: Record<string, string[]> = {};

        if (uniqueProductIds.length > 0) {
          try {
            const [combiResponse, ovResponse]: any[] = await Promise.all([
              apiService.get(
                `/combinations?filter[id_product]=[${uniqueProductIds.join('|')}]&display=full`
              ),
              apiService.get('/product_option_values?display=full'),
            ]);

            const optionValueNames: Record<string, string> = {};
            const ovItems = ovResponse?.prestashop?.product_option_values?.product_option_value;
            const ovArray = ovItems ? (Array.isArray(ovItems) ? ovItems : [ovItems]) : [];
            for (const ov of ovArray) {
              const ovId = extractIdValue(ov.id);
              if (ovId) optionValueNames[ovId] = extractLanguageValue(ov.name);
            }

            const combiItems = combiResponse?.prestashop?.combinations?.combination;
            const combiArray = combiItems ? (Array.isArray(combiItems) ? combiItems : [combiItems]) : [];
            for (const c of combiArray) {
              const cId = extractIdValue(c.id);
              const cProductId = extractIdValue(c.id_product);
              const ovAssoc = c.associations?.product_option_values?.product_option_value;
              const ovIds = ovAssoc
                ? (Array.isArray(ovAssoc) ? ovAssoc : [ovAssoc]).map((o: any) => extractIdValue(o))
                : [];
              const names = ovIds.map((id: string) => optionValueNames[id]).filter(Boolean);
              const label = names.length > 0 ? names.join(', ') : extractIdValue(c.reference);
              if (cId) {
                combinationMap[cId] = label;
                if (cProductId) {
                  if (!productCombinationsMap[cProductId]) productCombinationsMap[cProductId] = [];
                  productCombinationsMap[cProductId].push(cId);
                }
              }
            }
          } catch (e) {
            console.warn('[stockStore] Impossible de résoudre les déclinaisons', e);
          }
        }

        stockMovements.value = rawMovements.map((m: any): StockMovementDisplay => {
          const saId = extractIdValue(m.id_stock);
          const saInfo = stockAvailableMap[saId];
          const productId = saInfo?.id_product || extractIdValue(m.id_product) || '';
          const combiId = saInfo?.id_product_attribute && saInfo.id_product_attribute !== '0'
            ? saInfo.id_product_attribute
            : '';

          let combination_name = '';
          if (combiId) {
            combination_name = combinationMap[combiId] || '';
          } else {
            const combiIds = productCombinationsMap[productId] || [];
            if (combiIds.length === 1) {
              combination_name = combinationMap[combiIds[0]] || '';
            }
          }

          return {
            id_stock_mvt: extractIdValue(m['@_id'] ?? m.id) || undefined,
            id_stock: saId,
            id_product: productId,
            id_product_attribute: combiId || undefined,
            combination_name: combination_name || undefined,
            sign: Number(extractIdValue(m.sign)),
            physical_quantity: Number(extractIdValue(m.physical_quantity)),
            date_add: String(m.date_add?.['#text'] ?? m.date_add ?? '').trim(),
          };
        });
        console.log(`[stockStore] ${stockMovements.value.length} mouvements récupérés.`);
      } else {
        stockMovements.value = [];
        console.log('[stockStore] Aucun mouvement trouvé dans le XML.', response);
      }
    } catch (error) {
      console.error('Failed to fetch stock movements', error);
      stockMovements.value = [];
    } finally {
      loading.value = false;
    }
  };

  const addStock = async (id_product: string, delta: number, id_product_attribute = '0') => {
    loading.value = true;
    try {
      const payload: StockMovementPayload = {
        id_product: Number(id_product),
        id_product_attribute: Number(id_product_attribute),
        physical_quantity: Math.abs(delta),
        sign: delta > 0 ? 1 : -1,
        id_stock_mvt_reason: 1,
        date_add: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      await apiService.postStockMvt('/stockmvtapi/stockmvt', { stock_mvt: payload });
      console.log(`[stockStore] Stock mis à jour : ${delta > 0 ? '+' : ''}${delta} pour produit ${id_product} (déclinaison ${id_product_attribute})`);
      await fetchStockMovements();
    } catch (error) {
      console.error('Failed to add stock', error);
      alert("Erreur lors de l'ajout du stock.");
    } finally {
      loading.value = false;
    }
  };

  return {
    stockMovements,
    loading,
    fetchStockMovements,
    addStock
  };
});
