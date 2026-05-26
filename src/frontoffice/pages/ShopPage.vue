<template>
  <div class="shop-page">
    <div class="shop-container">
      <header class="shop-header">
        <div>
          <h1 class="shop-title">Shop All</h1>
          <p class="shop-count">{{ filteredProducts.length }} items found</p>
        </div>
        <div class="shop-header-actions">
          <button @click="openPasswordModal" class="btn-remove-stock">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="action-icon">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="12" x2="15" y2="12"></line>
            </svg>
            Retirer du stock
          </button>
        </div>
      </header>
      
      <section class="shop-filters-section">
        <ProductFilters :key="filtersKey" @filter="applyFilters" />
      </section>
      
      <main class="shop-main">
        <!-- Skeleton loading -->
        <div v-if="loading" class="product-grid">
          <div v-for="n in 8" :key="n" class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
        
        <div v-else-if="error" class="alert alert-error">{{ error }}</div>
        
        <div v-else-if="filteredProducts.length === 0" class="no-results">
          <p>No products found matching your criteria.</p>
          <button @click="resetAll" class="btn-text">Clear filters</button>
        </div>
        
        <div v-else class="product-grid">
          <ProductCard
              v-for="product in paginatedProducts"
              :key="product.id_product"
              :product="product"
          />
        </div>
 
        <BasePagination
          v-if="!loading && !error && filteredProducts.length > 0"
          v-model:current-page="currentPage"
          :total-items="filteredProducts.length"
          :items-per-page="itemsPerPage"
        />
      </main>
    </div>
  </div>

  <!-- Password verification modal -->
  <BaseModal v-model:show="isPasswordModalOpen" title="Authentification requise" size="sm">
    <div class="modal-form-content">
      <p class="modal-description">Veuillez insérer le mot de passe du backoffice pour continuer.</p>
      
      <BaseInput
        v-model="passwordInput"
        type="password"
        label="Mot de passe"
        placeholder="••••••••"
        :error="passwordError"
        required
        @keyup.enter="handleVerifyPassword"
      />
      
      <div class="modal-actions-wrapper">
        <BaseButton @click="isPasswordModalOpen = false" variant="secondary">Annuler</BaseButton>
        <BaseButton @click="handleVerifyPassword" variant="primary">Valider</BaseButton>
      </div>
    </div>
  </BaseModal>

  <!-- Stock removal modal -->
  <BaseModal v-model:show="isRemovalModalOpen" title="Retirer du stock par catégorie" size="md">
    <form @submit.prevent="handleRemoveStock" class="modal-form-content">
      <p class="modal-description">Cette action diminuera le stock de tous les produits et déclinaisons de la catégorie sélectionnée.</p>
      
      <BaseSelect
        v-model="selectedCategory"
        :options="categoryOptions"
        label="Catégorie"
        placeholder="Sélectionner une catégorie"
        required
      />
      
      <BaseInput
        v-model.number="removalQuantity"
        type="number"
        label="Quantité à retirer"
        placeholder="Ex: 2"
        required
        min="1"
      />
      
      <div class="modal-actions-wrapper">
        <BaseButton @click="isRemovalModalOpen = false" variant="secondary" :disabled="stockStore.loading">
          Annuler
        </BaseButton>
        <BaseButton type="submit" variant="danger" :loading="stockStore.loading">
          Retirer
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProduct } from '@features/catalog/composables/useProduct';
import { useProductFilters } from '@features/catalog/composables/useProductFilters';
import ProductCard from '@features/catalog/components/ProductCard.vue';
import ProductFilters from '@features/catalog/components/ProductFilters.vue';
import BasePagination from '@shared/ui/components/BasePagination.vue';
import BaseModal from '@shared/ui/components/BaseModal.vue';
import BaseInput from '@shared/ui/components/BaseInput.vue';
import BaseSelect from '@shared/ui/components/BaseSelect.vue';
import BaseButton from '@shared/ui/components/BaseButton.vue';
import { extractLanguageValue } from "@shared/utils/extractLanguageValue";
import { useStockStore } from "@shared/models/stock";
import { categorieService, Category } from "@shared/models/category";

const router = useRouter();
const stockStore = useStockStore();

const categories = ref<Category[]>([]);

const { products, loading, error, fetchProducts } = useProduct();
const { filters, filteredProducts, applyFilters } = useProductFilters(products);
 
const currentPage = ref(1);
const itemsPerPage = 12;
const filtersKey = ref(0);

// Modal States
const isPasswordModalOpen = ref(false);
const isRemovalModalOpen = ref(false);
const passwordInput = ref('');
const passwordError = ref('');
const selectedCategory = ref('');
const removalQuantity = ref(1);

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    value: cat.id,
    label: cat.name
  }));
});

const openPasswordModal = () => {
  passwordInput.value = '';
  passwordError.value = '';
  isPasswordModalOpen.value = true;
};

const handleVerifyPassword = () => {
  if (passwordInput.value === 'admin') {
    isPasswordModalOpen.value = false;
    isRemovalModalOpen.value = true;
    selectedCategory.value = '';
    removalQuantity.value = 1;
  } else {
    passwordError.value = 'Mot de passe incorrect.';
  }
};

const handleRemoveStock = async () => {
  if (!selectedCategory.value || removalQuantity.value <= 0) return;
  
  const category = categories.value.find(c => c.id === selectedCategory.value);
  const categoryName = category ? category.name : selectedCategory.value;
  
  try {
    await stockStore.removeStockForCategory(
      selectedCategory.value,
      categoryName,
      removalQuantity.value
    );
    isRemovalModalOpen.value = false;
    router.push('/stock-removal-report');
  } catch (err) {
    console.error('Erreur lors du retrait de stock:', err);
  }
};
 
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});
 
// Reset to page 1 when filters change
watch(filteredProducts, () => {
  currentPage.value = 1;
});
 
onMounted(async () => {
  await fetchProducts();
  try {
    categories.value = await categorieService.getAll();
  } catch (err) {
    console.error('Erreur chargement categories:', err);
  }
});
 
const resetAll = () => {
  filtersKey.value++;
  applyFilters({
    name: '',
    category: '',
    priceMin: null,
    priceMax: null
  });
};

</script>

<style scoped>
.shop-page {
  padding: 4rem 0;
}

.shop-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 3rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eeeeee;
}

.shop-title {
  font-size: 2.5rem;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0;
}

.shop-count {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
  padding-bottom: 0.5rem;
}

.shop-filters-section {
  margin-bottom: 4rem;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4rem 2rem;
}

.no-results {
  text-align: center;
  padding: 6rem 0;
  color: #666;
}

.btn-text {
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
  padding: 0.5rem;
  margin-top: 1rem;
  font-size: 0.9rem;
}

/* Skeleton */
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-image {
  aspect-ratio: 1;
  background-color: #f7f7f7;
  position: relative;
  overflow: hidden;
}

.skeleton-image::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.5s infinite;
}

.skeleton-line {
  height: 1rem;
  background-color: #f7f7f7;
}

.skeleton-line.short { width: 40%; }

@keyframes shimmer {
  100% { transform: translateX(100%); }
}

@media (max-width: 1200px) {
  .product-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .product-grid { grid-template-columns: repeat(2, 1fr); gap: 2rem 1.5rem; }
  .shop-title { font-size: 1.8rem; }
}

@media (max-width: 480px) {
  .product-grid { grid-template-columns: 1fr; }
}

.shop-header-actions {
  display: flex;
  align-items: center;
}

.btn-remove-stock {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: 1px solid var(--color-border, #e2e8f0);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-family: var(--font-main, inherit);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main, #1e293b);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove-stock:hover {
  background-color: var(--color-bg, #f8fafc);
  border-color: var(--color-primary, #0f172a);
}

.action-icon {
  color: var(--color-text-muted, #64748b);
}

.modal-form-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 1rem);
}

.modal-description {
  font-size: 0.875rem;
  color: var(--color-text-muted, #64748b);
  margin: 0 0 var(--space-2, 0.5rem) 0;
  line-height: 1.4;
}

.modal-actions-wrapper {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3, 0.75rem);
  margin-top: var(--space-4, 1rem);
}
</style>