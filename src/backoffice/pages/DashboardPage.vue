<template>
  <div class="dashboard-page">
    <h1 class="page-title">Tableau de bord</h1>

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

      <h2 class="section-title">Statistiques par jour</h2>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Nombre de commandes</th>
              <th>Montant total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in orderStore.dailyStats" :key="stat.date">
              <td>{{ stat.date }}</td>
              <td>{{ stat.count }}</td>
              <td>{{ stat.amount.toFixed(2) }} €</td>
            </tr>
            <tr v-if="orderStore.dailyStats.length === 0">
              <td colspan="3" class="empty-state">Aucune donnée disponible</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOrderStore } from '@features/checkout/stores/adminOrderStore';

const orderStore = useOrderStore();

onMounted(async () => {
  await orderStore.fetchOrders();
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
  margin-bottom: 1.5rem;
  color: var(--text-main, #1e293b);
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

.table-container {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}

.data-table th {
  padding: 1rem;
  font-weight: 500;
  color: #334155;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table tbody tr:hover {
  background-color: #f8fafc;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 1rem;
}

.loading {
  font-size: 1rem;
  color: #64748b;
  padding: 2rem 0;
}
</style>
