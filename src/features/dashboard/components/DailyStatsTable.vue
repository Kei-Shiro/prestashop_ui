<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Nombre de commandes</th>
          <th>Montant total (HT)</th>
          <th>Montant total (TTC)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in paginatedStats" :key="stat.date">
          <td>{{ stat.date }}</td>
          <td>{{ stat.count }}</td>
          <td>{{ stat.amount.toFixed(2) }} €</td>
          <td>{{ stat.amountTTC.toFixed(2) }} €</td>
        </tr>
        <tr v-if="paginatedStats.length === 0">
          <td colspan="4" class="empty-state">Aucune donnée disponible</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  paginatedStats: {
    type: Array as PropType<Array<{ date: string, count: number, amount: number, amountTTC: number }>>,
    required: true
  }
});
</script>

<style scoped>
.table-container {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 1rem;
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
  padding: 2rem;
}
</style>
