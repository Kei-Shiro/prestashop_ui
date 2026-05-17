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
        <div class="form-group flex-1" v-if="productCombinations.length > 0">
          <label class="form-label">Déclinaison</label>
          <select v-model="selectedCombination" required class="form-input" :disabled="loadingCombinations">
            <option value="" disabled>{{ loadingCombinations ? 'Chargement...' : 'Sélectionner une déclinaison' }}</option>
            <option v-for="combo in productCombinations" :key="combo.id" :value="combo.id">
              {{ combo.name }}
            </option>
          </select>
        </div>
        <div class="form-group w-32">
          <label class="form-label">Quantité</label>
          <input type="number" v-model.number="quantity"  class="form-input" />
        </div>
        <button type="submit" class="submit-btn" :disabled="stockStore.loading">
          {{ stockStore.loading ? 'Ajout...' : 'Ajouter' }}
        </button>
      </form>
    </div>

    <!-- Daily Stock Evolution section -->
    <div class="section-header">
      <h2 class="section-title">Évolution journalière du stock</h2>
      <div class="filter-container">
        <div class="filter-group">
          <label class="filter-label">Filtrer par produit</label>
          <select v-model="filterProduct" class="filter-input">
            <option value="all">Tous les produits</option>
            <option v-for="product in productStore.products" :key="product.id_product || (product as any).id" :value="String(product.id_product || (product as any).id)">
              {{ extractLanguageValue(product.name) || `Produit #${product.id_product || (product as any).id}` }}
            </option>
          </select>
        </div>
        <div class="filter-group" v-if="filterCombinations.length > 0">
          <label class="filter-label">Déclinaison</label>
          <select v-model="filterCombination" class="filter-input">
            <option value="all">Toutes les déclinaisons</option>
            <option v-for="combo in filterCombinations" :key="combo.id" :value="String(combo.id)">
              {{ combo.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="stockStore.loading" class="loading">Chargement des données...</div>
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            <th class="text-right">Mouvement</th>
            <th class="text-right">Quantité après</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in paginatedMovements" :key="entry.id_stock_mvt || entry.date_add">
            <td class="col-date">{{ formatDate(entry.date_add) }}</td>
            <td class="col-product">
              {{ getProductName(entry.id_product) }}
              <span v-if="entry.combination_name" class="combination-tag">{{ entry.combination_name }}</span>
            </td>
            <td class="col-movement text-right">
              <span :class="entry.sign > 0 ? 'text-positive' : 'text-negative'">
                {{ entry.sign > 0 ? '+' : '-' }}{{ entry.physical_quantity }}
              </span>
            </td>
            <td class="col-quantity text-right">
              {{ entry.running_total ?? '-' }}
            </td>
          </tr>
          <tr v-if="filteredMovements.length === 0">
            <td colspan="4" class="empty-state">Aucune donnée disponible</td>
          </tr>
        </tbody>
      </table>
    </div>

    <BasePagination
      v-if="!stockStore.loading && filteredMovements.length > 0"
      v-model:current-page="currentPage"
      :total-items="filteredMovements.length"
      :items-per-page="itemsPerPage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useProductStore } from '@features/catalog/stores/adminProductStore';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { useStockStore } from '@features/inventory/stores/stockStore';
import productService from '@features/catalog/services/product-service';
import BasePagination from '@shared/ui/components/BasePagination.vue';

const productStore = useProductStore();
const stockStore = useStockStore();

const selectedProduct = ref('');
const selectedCombination = ref('');
const quantity = ref(1);

const filterProduct = ref('all');
const filterCombination = ref('all');

const currentPage = ref(1);
const itemsPerPage = 10;

// Filter and sort movements
const filteredMovements = computed(() => {
  let list = [...stockStore.stockMovements];
  
  // Apply product filter
  if (filterProduct.value !== 'all') {
    list = list.filter(m => String(m.id_product) === filterProduct.value);
    
    // Apply combination filter only if a product is selected
    if (filterCombination.value !== 'all') {
      list = list.filter(m => String(m.id_product_attribute || '0') === filterCombination.value);
    }
  }

  // Sort by date ascending to calculate running total
  list.sort((a, b) => new Date(a.date_add).getTime() - new Date(b.date_add).getTime());

  // Calculate running totals per unique product/attribute
  const totals: Record<string, number> = {};
  const withTotals = list.map(m => {
    const key = `${m.id_product}_${m.id_product_attribute || '0'}`;
    const movementValue = m.sign * m.physical_quantity;
    totals[key] = (totals[key] || 0) + movementValue;
    return { ...m, running_total: totals[key] };
  });

  // Sort back to descending for display (most recent first)
  return withTotals.sort((a, b) => new Date(b.date_add).getTime() - new Date(a.date_add).getTime());
});

const paginatedMovements = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredMovements.value.slice(start, start + itemsPerPage);
});

interface ComboOption { id: string; name: string }
const productCombinations = ref<ComboOption[]>([]);
const filterCombinations = ref<ComboOption[]>([]);
const loadingCombinations = ref(false);

const loadCombinations = async (productId: string, targetRef: any) => {
    targetRef.value = [];
    if (!productId || productId === 'all') return;

    loadingCombinations.value = true;
    try {
        const [combinations, optionValues] = await Promise.all([
            productService.getCombinations(Number(productId)),
            productService.getProductOptionValues(),
        ]);

        const ovNames: Record<string, string> = {};
        for (const ov of optionValues) {
            const id = extractIdValue(ov.id);
            if (id) ovNames[id] = extractLanguageValue(ov.name);
        }

        targetRef.value = combinations.map((c: any) => {
            const cId = extractIdValue(c.id);
            const ovAssoc = c.associations?.product_option_values?.product_option_value;
            const ovIds = ovAssoc
                ? (Array.isArray(ovAssoc) ? ovAssoc : [ovAssoc]).map((o: any) => extractIdValue(o))
                : [];
            const names = ovIds.map((id: string) => ovNames[id]).filter(Boolean);
            return { id: cId, name: names.length > 0 ? names.join(', ') : extractIdValue(c.reference) || `#${cId}` };
        });
    } finally {
        loadingCombinations.value = false;
    }
};

watch(selectedProduct, (val) => {
    selectedCombination.value = '';
    loadCombinations(val, productCombinations);
});

watch(filterProduct, (val) => {
    filterCombination.value = 'all';
    currentPage.value = 1;
    loadCombinations(val, filterCombinations);
});

watch(filterCombination, () => {
    currentPage.value = 1;
});

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
    if (!selectedProduct.value || quantity.value === 0) return;
    if (productCombinations.value.length > 0 && !selectedCombination.value) return;

    await stockStore.addStock(
        selectedProduct.value,
        quantity.value,
        selectedCombination.value || '0'
    );

    quantity.value = 1;
    selectedProduct.value = '';
    selectedCombination.value = '';
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-main, #1e293b);
  margin: 0;
}

.filter-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.filter-input {
  padding: 0.375rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #ffffff;
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

.col-quantity {
  font-weight: 600;
  color: #0f172a;
}

.text-right {
  text-align: right;
}

.combination-tag {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #1d4ed8;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.25rem;
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
