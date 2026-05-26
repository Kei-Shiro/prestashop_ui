<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStockStore } from '@shared/models/stock';
import BaseButton from '@shared/ui/components/BaseButton.vue';

const router = useRouter();
const stockStore = useStockStore();

const report = computed(() => stockStore.lastRemovalReport);

const goBack = () => {
  router.push('/shop');
};
</script>

<template>
  <div class="report-page">
    <div class="report-container">
      <div v-if="!report" class="empty-report">
        <div class="empty-icon">📋</div>
        <h2>Aucun rapport disponible</h2>
        <p>Veuillez d'abord effectuer un retrait de stock depuis la page Boutique.</p>
        <BaseButton @click="goBack" variant="primary">Retourner à la boutique</BaseButton>
      </div>

      <div v-else>
        <!-- Header -->
        <header class="report-header">
          <h1 class="report-title">Rapport de retrait de stock</h1>
          <p class="report-subtitle">Catégorie : <strong>{{ report.categoryName }}</strong></p>
        </header>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Quantité demandée (par produit/déclinaison)</span>
            <span class="kpi-value">{{ report.requestedQty }}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Somme demandée à retirer</span>
            <span class="kpi-value text-muted">{{ report.totalRequested }}</span>
          </div>
          <div class="kpi-card kpi-card--success">
            <span class="kpi-label">Somme réellement retirée</span>
            <span class="kpi-value text-success">{{ report.totalActuallyRemoved }}</span>
          </div>
        </div>

        <!-- Details Table -->
        <div class="details-section">
          <h2 class="section-title">Détails des modifications</h2>
          <div class="table-wrapper">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Référence</th>
                  <th>Déclinaison</th>
                  <th class="text-right">Stock Initial</th>
                  <th class="text-right">Demande</th>
                  <th class="text-right">Retiré</th>
                  <th class="text-right">Stock Final</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in report.items" :key="idx">
                  <td class="col-product">{{ item.productName }}</td>
                  <td class="col-ref">{{ item.reference || '-' }}</td>
                  <td>
                    <span v-if="item.combinationName" class="variant-tag">{{ item.combinationName }}</span>
                    <span v-else class="no-variant">-</span>
                  </td>
                  <td class="text-right font-mono">{{ Math.max(0, item.initialStock) }}</td>
                  <td class="text-right font-mono text-muted">{{ item.requestedToRemove }}</td>
                  <td class="text-right font-mono font-semibold" :class="item.actuallyRemoved > 0 ? 'text-negative' : ''">
                    {{ Math.max(0, item.actuallyRemoved) }}
                  </td>
                  <td class="text-right font-mono font-semibold">{{ item.finalStock }}</td>
                </tr>
                <tr v-if="report.items.length === 0">
                  <td colspan="7" class="empty-rows">Aucun produit trouvé dans cette catégorie.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="action-footer">
          <BaseButton @click="goBack" variant="secondary" size="lg">
            Retourner à la boutique
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@shared/ui/styles/tokens.css';

.report-page {
  padding: 4rem 0;
  background-color: var(--color-bg);
  min-height: calc(100vh - 120px);
}

.report-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
}

.empty-report {
  text-align: center;
  background-color: var(--color-surface);
  padding: 4rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.empty-icon {
  font-size: 3rem;
}

.empty-report h2 {
  font-family: var(--font-main);
  font-size: 1.5rem;
  color: var(--color-text-main);
  margin: 0;
}

.empty-report p {
  color: var(--color-text-muted);
  max-width: 400px;
  margin: 0 0 var(--space-2) 0;
}

.report-header {
  margin-bottom: 3rem;
  text-align: center;
}

.report-title {
  font-family: var(--font-main);
  font-size: 2.25rem;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--color-text-main);
  margin: 0 0 var(--space-2) 0;
}

.report-subtitle {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin: 0;
}

.report-subtitle strong {
  color: var(--color-primary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  margin-bottom: 3rem;
}

.kpi-card {
  background-color: var(--color-surface);
  padding: var(--space-6);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.kpi-card--success {
  border-color: rgba(27, 94, 32, 0.2);
  background-color: rgba(27, 94, 32, 0.02);
}

.kpi-label {
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.kpi-value {
  font-family: var(--font-main);
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-main);
  line-height: 1;
}

.text-muted {
  color: var(--color-text-muted);
}

.text-success {
  color: var(--color-success);
}

.details-section {
  background-color: var(--color-surface);
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--color-border);
  margin-bottom: 3rem;
  overflow: hidden;
}

.section-title {
  font-family: var(--font-main);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin: 0;
  padding: var(--space-6) var(--space-6) 0 var(--space-6);
}

.table-wrapper {
  overflow-x: auto;
  padding: var(--space-6);
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.report-table th {
  padding: var(--space-3) var(--space-4);
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.report-table td {
  padding: var(--space-4);
  font-size: 0.875rem;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
}

.report-table tbody tr:last-child td {
  border-bottom: none;
}

.col-product {
  font-weight: 500;
}

.col-ref {
  color: var(--color-text-muted);
}

.variant-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}

.no-variant {
  color: var(--color-text-muted);
}

.font-mono {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
}

.font-semibold {
  font-weight: 600;
}

.text-right {
  text-align: right;
}

.text-negative {
  color: var(--color-danger);
}

.empty-rows {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-8) !important;
}

.action-footer {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }
}
</style>
