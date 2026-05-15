<template>
  <div class="stock-page">
    <h1 class="page-title">Gestion des stocks</h1>

    <!-- Add Stock section -->
    <div class="add-stock-card">
      <h2 class="section-title">Ajouter au stock</h2>
      <form @submit.prevent="handleAddStock" class="form-container">
        <div class="form-group flex-1">
          <label class="form-label">Produit</label>
          <select v-model="selectedProduct" required class="form-input">
            <option value="" disabled>Sélectionner un produit</option>
            <option v-for="product in productStore.products" :key="product.id_product || (product as any).id" :value="product.id_product || (product as any).id">
              {{ extractLanguageValue(product.name) || `Produit #${product.id_product || (product as any).id}` }}
            </option>
          </select>
        </div>
        <div class="form-group w-32">
          <label class="form-label">Quantité</label>
          <input type="number" v-model.number="quantity" required min="1" class="form-input" />
        </div>
        <button type="submit" class="submit-btn" :disabled="stockStore.loading">
          {{ stockStore.loading ? 'Ajout...' : 'Ajouter' }}
        </button>
      </form>
    </div>

    <!-- Daily Stock Evolution section -->
    <h2 class="section-title">Évolution journalière du stock</h2>

    <div v-if="stockStore.loading" class="loading">Chargement des données...</div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            <th>Mouvement</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in stockStore.stockMovements" :key="entry.id_stock_mvt || entry.date_add">
            <td class="col-date">{{ formatDate(entry.date_add) }}</td>
            <td class="col-product">{{ getProductName(entry.id_product) }}</td>
            <td class="col-movement">
              <span :class="entry.sign > 0 ? 'text-positive' : 'text-negative'">
                {{ entry.sign > 0 ? '+' : '-' }}{{ entry.physical_quantity }}
              </span>
            </td>
          </tr>
          <tr v-if="stockStore.stockMovements.length === 0">
            <td colspan="3" class="empty-state">Aucune donnée disponible</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useProductStore } from '../stores/product';
import { useStockStore } from '../stores/stock';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

const productStore = useProductStore();
const stockStore = useStockStore();

const selectedProduct = ref('');
const quantity = ref(1);

onMounted(async () => {
    await Promise.all([
        productStore.fetchProducts(),
        stockStore.fetchStockMovements()
    ]);
});

const getProductName = (id: string) => {
    const product = productStore.products.find((p: any) => String(p.id_product || p.id) === String(id));
    if (!product) return `Produit #${id}`;
    return extractLanguageValue(product.name) || `Produit #${id}`;
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
};

const handleAddStock = async () => {
    if (!selectedProduct.value || quantity.value <= 0) return;

    await stockStore.addStock(selectedProduct.value, quantity.value);

    quantity.value = 1;
    selectedProduct.value = '';
};
</script>

<style scoped>
.stock-page {
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

.add-stock-card {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
}

.form-container {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
  min-width: 200px;
}

.w-32 {
  width: 8rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #2563eb;
}

.submit-btn {
  background-color: #2563eb;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  height: 42px; /* align with inputs */
}

.submit-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

.col-date {
  font-weight: 500;
  color: #0f172a;
}

.col-product {
  color: #475569;
}

.text-positive {
  color: #16a34a;
  font-weight: 500;
}

.text-negative {
  color: #dc2626;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 1.5rem;
}

.loading {
  font-size: 1rem;
  color: #64748b;
  padding: 2rem 0;
}
</style>
