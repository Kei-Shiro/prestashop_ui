import { defineStore } from 'pinia';
import { ref } from 'vue';
import { statsService } from '../services/stats-service';
import { withLoading } from '@shared/utils/asyncUtils';

export const useStatsStore = defineStore('stats', () => {
    const categoryStats = ref<Array<{name: string, sales: number, purchases: number, profit: number}>>([]);
    const isLoading = ref(false);

    /**
     * Appel à l'API et au service pour calculer les statistiques.
     * Cette fonction met à jour les états `isLoading` et `categoryStats`.
     */
    const categoryStocks = ref<Array<{name: string, physical: number, reserved: number, available: number}>>([]);
    const isStockLoading = ref(false);

    const fetchStats = () => withLoading(isLoading, async () => {
        categoryStats.value = await statsService.getProfitByCategoryReport();
    }, undefined, "Erreur lors du calcul des bénéfices");

    const fetchStocks = () => withLoading(isStockLoading, async () => {
        categoryStocks.value = await statsService.getStockByCategoryReport();
    }, undefined, "Erreur lors du calcul des stocks");

    return { categoryStats, isLoading, fetchStats, categoryStocks, isStockLoading, fetchStocks };
});
