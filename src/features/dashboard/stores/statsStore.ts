import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statsService } from '../services/stats-service';

export const useStatsStore = defineStore('stats', () => {
    const categoryStats = ref<Array<{name: string, sales: number, purchases: number, profit: number}>>([]);
    const isLoading = ref(false);

    /**
     * Appel à l'API et au service pour calculer les statistiques.
     * Cette fonction met à jour les états `isLoading` et `categoryStats`.
     */
    const categoryStocks = ref<Array<{name: string, physical: number, reserved: number, available: number}>>([]);
    const isStockLoading = ref(false);

    async function fetchStats() {
        isLoading.value = true;
        try {
            categoryStats.value = await statsService.getProfitByCategoryReport();
        } catch (error) {
            console.error("[StatsStore] Erreur lors du calcul des bénéfices :", error);
        } finally {
            isLoading.value = false;
        }
    }

    async function fetchStocks() {
        isStockLoading.value = true;
        try {
            categoryStocks.value = await statsService.getStockByCategoryReport();
        } catch (error) {
            console.error("[StatsStore] Erreur lors du calcul des stocks :", error);
        } finally {
            isStockLoading.value = false;
        }
    }

    return { categoryStats, isLoading, fetchStats, categoryStocks, isStockLoading, fetchStocks };
});
