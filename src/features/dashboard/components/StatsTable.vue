<template>
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Catégorie</th>
          <th class="text-right">Total Ventes (HT)</th>
          <th class="text-right">Coût Achat (HT)</th>
          <th class="text-right">Bénéfice Net (HT)</th>
          <th class="text-right">Marge (%)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stat in stats" :key="stat.name">
          <td>{{ stat.name }}</td>
          <!-- Chiffre d'affaires -->
          <td class="text-right">{{ stat.sales.toFixed(2) }} €</td>
          <!-- Coût de revient -->
          <td class="text-right">{{ stat.purchases.toFixed(2) }} €</td>
          <!-- Bénéfice net (vert si positif, rouge si négatif) -->
          <td class="text-right" :class="stat.profit >= 0 ? 'text-success' : 'text-danger'">
            {{ stat.profit > 0 ? '+' : '' }}{{ stat.profit.toFixed(2) }} €
          </td>
          <!-- Marge en pourcentage -->
          <td class="text-right margin-cell">
            <span class="badge" :class="stat.profit >= 0 ? 'badge-success' : 'badge-danger'">
              {{ stat.sales > 0 ? ((stat.profit / stat.sales) * 100).toFixed(1) : 0 }} %
            </span>
          </td>
        </tr>
        <tr v-if="stats.length === 0">
          <td colspan="5" class="empty-state">Aucune donnée trouvée ou aucune vente valide.</td>
        </tr>
      </tbody>
      <tfoot v-if="stats.length > 0" class="table-footer">
        <tr>
          <th>Total Général</th>
          <th class="text-right">{{ totalSales.toFixed(2) }} €</th>
          <th class="text-right">{{ totalPurchases.toFixed(2) }} €</th>
          <th class="text-right" :class="totalProfit >= 0 ? 'text-success' : 'text-danger'">
            {{ totalProfit > 0 ? '+' : '' }}{{ totalProfit.toFixed(2) }} €
          </th>
          <th class="text-right margin-cell">
            <span class="badge" :class="totalProfit >= 0 ? 'badge-success' : 'badge-danger'">
              {{ totalMargin.toFixed(1) }} %
            </span>
          </th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script setup lang="ts">
import { PropType, computed } from 'vue';

const props = defineProps({
  stats: {
    type: Array as PropType<Array<{name: string, sales: number, purchases: number, profit: number}>>,
    required: true
  }
});

const totalSales = computed(() => props.stats.reduce((sum, stat) => sum + stat.sales, 0));
const totalPurchases = computed(() => props.stats.reduce((sum, stat) => sum + stat.purchases, 0));
const totalProfit = computed(() => props.stats.reduce((sum, stat) => sum + stat.profit, 0));
const totalMargin = computed(() => {
  if (totalSales.value > 0) {
    return (totalProfit.value / totalSales.value) * 100;
  }
  return 0;
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

.table-footer th {
  padding: 1rem;
  font-weight: 700;
  color: #1e293b;
  background-color: #f1f5f9;
  border-top: 2px solid #cbd5e1;
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

.margin-cell {
  vertical-align: middle;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>
