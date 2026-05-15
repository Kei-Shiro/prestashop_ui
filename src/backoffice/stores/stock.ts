import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@shared/services/api-service';

export interface StockMovement {
  id_stock_mvt?: string;
  id_product: string;
  sign: number;
  physical_quantity: number;
  date_add: string;
}

export const useStockStore = defineStore('stock', () => {
  const stockMovements = ref<StockMovement[]>([]);
  const loading = ref(false);

  const fetchStockMovements = async () => {
    loading.value = true;
    try {
      // Dans PrestaShop API, la ressource est stock_movements, 
      // mais le tag XML renvoyé est souvent stock_mvts
      const response: any = await apiService.get('/stock_movements?display=full');
      
      // Essayer les deux tags possibles (standard vs raccourci PS)
      const pStock = response?.prestashop?.stock_mvts?.stock_mvt || 
                     response?.prestashop?.stock_movements?.stock_movement;
      
      if (pStock) {
        stockMovements.value = Array.isArray(pStock) ? pStock : [pStock];
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

  const addStock = async (id_product: string, delta: number) => {
    loading.value = true;
    try {
      const apiKey = import.meta.env.VITE_PS_API_KEY || 'J09EBRW5vXN7UH45DP28m4dWneKUHoyc';
      
      // Appel à l'endpoint personnalisé (XML)
      const url = `/prestashop/update_stock_custom.php?id_product=${id_product}&delta=${delta}&ws_key=${apiKey}`;
      
      const res = await fetch(url);
      const text = await res.text();

      if (text.includes('<success>true</success>')) {
          console.log(`[stockStore] Stock mis à jour : +${delta} pour produit ${id_product}`);
          await fetchStockMovements();
      } else {
          console.error('[stockStore] Erreur XML:', text);
          throw new Error("Erreur lors de la mise à jour (réponse serveur invalide)");
      }
    } catch (error) {
      console.error('Failed to add stock via custom endpoint', error);
      alert("Erreur lors de l'ajout du stock. Vérifiez que le fichier update_stock_custom.php est bien présent dans htdocs/prestashop/");
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
