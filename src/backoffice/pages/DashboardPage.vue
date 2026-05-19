<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <h1 class="page-title">Tableau de bord</h1>
      <div class="period-filter">
        <label for="period">Période : </label>
        <select id="period" v-model="orderStore.periodFilter" class="filter-select">
          <option value="all">Tout le temps</option>
          <option value="today">Aujourd'hui</option>
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
        </select>
      </div>
    </div>

    <div v-if="orderStore.loading" class="loading">Chargement des données...</div>
    <div v-else>
      <div class="summary-cards">
        <div class="card">
          <h3 class="card-title">Total Général Commandes</h3>
          <p class="card-value">{{ orderStore.totalOrders }}</p>
        </div>
        <div class="card">
          <h3 class="card-title">Total Général Montant</h3>
          <p class="card-value">{{ orderStore.totalAmount.toFixed(2) }} €</p>
        </div>
        <div class="card card--accent">
          <h3 class="card-title">Paniers actifs (En cours)</h3>
          <p class="card-value">{{ (orderStore as any).activeCartsCount }}</p>
        </div>
      </div>


      <h2 class="section-title">Stocks par Catégorie</h2>
      <div v-if="statsStore.isStockLoading" class="loading">Analyse des stocks en cours...</div>
      <StockStatsTable v-else :stocks="statsStore.categoryStocks || []" />

      <h2 class="section-title">Statistiques par jour</h2>
      <DailyStatsTable :paginated-stats="paginatedStats" />

      <BasePagination
        v-if="orderStore.dailyStats.length > 0"
        v-model:current-page="currentPage"
        :total-items="orderStore.dailyStats.length"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useOrderStore } from '@features/checkout/stores/adminOrderStore';
import { useStatsStore } from '@features/dashboard/stores/statsStore';
import BasePagination from '@shared/ui/components/BasePagination.vue';
import StockStatsTable from '@features/dashboard/components/StockStatsTable.vue';
import DailyStatsTable from '@features/dashboard/components/DailyStatsTable.vue';

const orderStore = useOrderStore();
const statsStore = useStatsStore();

const currentPage = ref(1);
const itemsPerPage = 10;

const paginatedStats = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return orderStore.dailyStats.slice(start, start + itemsPerPage);
});

onMounted(async () => {
  // Chargement parallèle
  await Promise.all([
    orderStore.fetchOrders(),
    statsStore.fetchStocks()
  ]);
});
</script>

<style scoped>
.dashboard-page {
  padding: 1.5rem;
  background-color: var(--bg-color, #f8fafc);
  min-height: 100vh;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #334155;
  font-weight: 500;
  cursor: pointer;
  outline: none;
}
.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-main, #1e293b);
}

.summary-cards {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.card {
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  flex: 1;
  min-width: 250px;
}

.card-title {
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.card-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #0f172a;
}



.loading {
  font-size: 1rem;
  color: #64748b;
  padding: 2rem 0;
}
</style>
