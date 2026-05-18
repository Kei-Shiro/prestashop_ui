<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useCarts } from '@features/checkout/composables/useCarts';
import BasePagination from '@shared/ui/components/BasePagination.vue';

const { carts, isLoading, error, convertingCartId, loadCarts, validateCartAsOrder } = useCarts();

const currentPage = ref(1);
const itemsPerPage = 15;

const paginatedCarts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return carts.value.slice(start, start + itemsPerPage);
});

onMounted(() => {
  loadCarts();
});

const confirmAndConvert = (cartId: number) => {
  if (confirm('Voulez-vous transformer ce panier en commande ?')) {
    validateCartAsOrder(cartId);
  }
};
</script>

<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Paniers</h1>
        <p class="page-subtitle">{{ carts.length }} panier{{ carts.length !== 1 ? 's' : '' }} non commandés</p>
      </div>
    </div>

    <div v-if="isLoading" class="state-box state-box--loading">
      <span class="spinner"></span>
      Chargement des paniers...
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
            <th>Client</th>
            <th>Nb Articles</th>
            <th>Créé le</th>
            <th>Mis à jour le</th>
            <th class="text-right">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="carts.length === 0">
            <td colspan="6" class="empty-cell">Aucun panier trouvé.</td>
          </tr>
          <tr v-for="cart in paginatedCarts" :key="cart.id">
            <td class="cell-id">#{{ cart.id }}</td>
            <td>{{ cart.customerName }}</td>
            <td class="cell-mono text-center">{{ cart.itemsCount }}</td>
            <td class="cell-mono">{{ cart.dateAdd }}</td>
            <td class="cell-mono">{{ cart.dateUpd }}</td>
            <td class="text-right">
              <button 
                class="btn-action" 
                :disabled="convertingCartId === cart.id"
                @click="confirmAndConvert(cart.id)"
              >
                <span v-if="convertingCartId === cart.id" class="spinner-small-white"></span>
                <span v-else>Commander</span>
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

      <BasePagination
        v-if="!isLoading && !error && carts.length > 0"
        v-model:current-page="currentPage"
        :total-items="carts.length"
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

.cell-mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12.5px;
  color: var(--muted);
}

.text-center { text-align: center; }

.empty-cell {
  text-align: center;
  padding: 56px 0;
  color: var(--muted);
  border: none;
}

.text-right { text-align: right; }

.btn-action {
  background-color: var(--accent-primary, #2563eb);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 90px;
  opacity: 1;
  visibility: visible;
}

.btn-action:hover:not(:disabled) {
  background-color: var(--accent-primary-hover, #1d4ed8);
  transform: translateY(-1px);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small-white {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
</style>
