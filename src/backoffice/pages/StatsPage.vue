<template>
  <div class="stats-page">
    <h1 class="page-title">Statistiques Financières</h1>

    <div class="stats-container">
      <h2 class="section-title">Bénéfices et Chiffre d'Affaires (par Catégorie)</h2>
      <div v-if="statsStore.isLoading" class="loading">Analyse financière en cours...</div>
      <StatsTable v-else :stats="statsStore.categoryStats" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useStatsStore } from '@features/dashboard/stores/statsStore';
import StatsTable from '@features/dashboard/components/StatsTable.vue';

const statsStore = useStatsStore();

onMounted(async () => {
  await statsStore.fetchStats();
});
</script>

<style scoped>
.stats-page {
  padding: 1.5rem;
  background-color: var(--bg-color, #f8fafc);
  min-height: 100vh;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--text-main, #1e293b);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-main, #1e293b);
}

.stats-container {
  background-color: transparent;
}

.loading {
  font-size: 1rem;
  color: #64748b;
  padding: 2rem 0;
}
</style>
