<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useOrders } from '@features/checkout/composables/useOrders';
import BasePagination from '@shared/ui/components/BasePagination.vue';

const { orders, orderStates, allowedStateIds, isLoading, error, updatingOrderId, loadOrdersAndMetadata, changeOrderStatus } = useOrders();

const currentPage = ref(1);
const itemsPerPage = 15;

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return orders.value.slice(start, start + itemsPerPage);
});

onMounted(() => {
  loadOrdersAndMetadata();
});
</script>

<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Commandes</h1>
        <p class="page-subtitle">{{ orders.length }} commande{{ orders.length !== 1 ? 's' : '' }} au total</p>
      </div>
    </div>

    <div v-if="isLoading" class="state-box state-box--loading">
      <span class="spinner"></span>
      Chargement des commandes...
    </div>

    <div v-else-if="error" class="state-box state-box--error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ error }}
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Référence</th>
            <th>Client</th>
            <th>Date</th>
            <th>Paiement</th>
            <th class="text-right">Total</th>
            <th>État</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="orders.length === 0">
            <td colspan="7" class="empty-cell">Aucune commande trouvée.</td>
          </tr>
          <tr v-for="order in paginatedOrders" :key="order.id">
            <td class="cell-id">#{{ order.id }}</td>
            <td class="cell-ref">{{ order.reference }}</td>
            <td>{{ order.customerName }}</td>
            <td class="cell-mono">{{ order.dateAdd }}</td>
            <td>{{ order.payment }}</td>
            <td class="cell-mono text-right cell-total">{{ order.totalPaid }} €</td>
            <td>
              <div class="status-cell">
                <span class="status-dot" :style="{ backgroundColor: order.currentState.color }"></span>

                <select
                  class="status-select"
                  :value="order.currentState.id"
                  :disabled="updatingOrderId === order.id"
                  @change="changeOrderStatus(order.id, Number(($event.target as HTMLSelectElement).value))"
                >
                  <option
                    v-if="!orderStates.some(s => s.id === order.currentState.id)"
                    :value="order.currentState.id"
                  >
                    {{ order.currentState.label }}
                  </option>
                  <option
                    v-for="state in orderStates.filter(s => allowedStateIds.includes(s.id) || s.id === order.currentState.id)"
                    :key="state.id"
                    :value="state.id"
                  >
                    {{ state.label }}
                  </option>
                </select>
                <span v-if="updatingOrderId === order.id" class="spinner-small"></span>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <BasePagination
        v-if="!isLoading && !error && orders.length > 0"
        v-model:current-page="currentPage"
        :total-items="orders.length"
        :items-per-page="itemsPerPage"
      />
    </div>

  </div>
</template>

<style scoped>
/* ─── Design tokens ──────────────────────────────────── */
:root {
  --bg:         #f9f9f8;
  --surface:    #ffffff;
  --border:     #e5e5e3;
  --text:       #1a1a18;
  --muted:      #6b6b66;
  --accent:     #2563eb;
  --danger-bg:  #fff1f1;
  --danger:     #dc2626;
  --radius:     8px;
  --shadow:     0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
}

/* ─── Layout ─────────────────────────────────────────── */
.page {
  padding: 40px 48px;
  background: var(--bg);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  color: var(--text);
  font-size: 14px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.3px;
  margin: 0 0 4px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

/* ─── States ─────────────────────────────────────────── */
.state-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--muted);
}

.state-box--error {
  background: var(--danger-bg);
  border-color: #fecaca;
  color: var(--danger);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spinner-small {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Table ──────────────────────────────────────────── */
.table-wrapper {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.table th,
.table td {
  padding: 11px 16px;
  border: 1px solid var(--border);
  vertical-align: middle;
}

.table th {
  text-align: left;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
  background: #fafaf9;
}

.table tbody tr {
  transition: background 0.1s;
}

.table tbody tr:hover { background: #fafaf9; }

/* ─── Cell variants ──────────────────────────────────── */
.cell-id {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--muted);
}

.cell-ref { font-weight: 500; }

.cell-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12.5px;
  color: var(--muted);
}

.cell-total {
  font-weight: 600;
  color: var(--text);
}

.text-right { text-align: right; }

.empty-cell {
  text-align: center;
  padding: 56px 0;
  color: var(--muted);
  border: none;
}

/* ─── Status cell ────────────────────────────────────── */
.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,.12);
}

.status-select {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 28px 5px 10px;
  font-size: 12.5px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  background: var(--surface)
  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b66' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")
  no-repeat right 8px center;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  min-width: 130px;
  outline: none;
}

.status-select:hover { border-color: #c0c0ba; }

.status-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}

.status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #fafaf9;
}
</style>
