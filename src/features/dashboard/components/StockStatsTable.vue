<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Catégorie</th>
          <th class="text-right">Qté physique</th>
          <th class="text-right">Qté réservée</th>
          <th class="text-right">Qté disponible</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in stocks" :key="stat.name">
          <td>{{ stat.name }}</td>
          <td class="text-right">{{ stat.physical }}</td>
          <td class="text-right text-warning" v-if="stat.reserved > 0">{{ stat.reserved }}</td>
          <td class="text-right" v-else>{{ stat.reserved }}</td>
          <td class="text-right" :class="stat.available <= 0 ? 'text-danger' : 'text-success'">
            {{ stat.available }}
          </td>
        </tr>
        <tr v-if="stocks.length === 0">
          <td colspan="4" class="empty-state">Aucune donnée de stock trouvée.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

defineProps({
  stocks: {
    type: Array as PropType<Array<{name: string, physical: number, reserved: number, available: number}>>,
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
  margin-bottom: 2rem;
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

.text-right {
  text-align: right;
}

.text-success {
  color: #10b981;
  font-weight: 700;
}

.text-danger {
  color: #ef4444;
  font-weight: 700;
}

.text-warning {
  color: #f59e0b;
  font-weight: 700;
}
</style>
