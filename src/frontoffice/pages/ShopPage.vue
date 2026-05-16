<template>
  <div class="shop-page">
    <div class="shop-container">
      <header class="shop-header">
        <h1 class="shop-title">Shop All</h1>
        <p class="shop-count">{{ filteredProducts.length }} items found</p>
      </header>
      
      <section class="shop-filters-section">
        <ProductFilters @filter="applyFilters" />
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useProduct } from '@features/catalog/composables/useProduct';
import { useProductFilters } from '@features/catalog/composables/useProductFilters';
import ProductCard from '@features/catalog/components/ProductCard.vue';
import ProductFilters from '@features/catalog/components/ProductFilters.vue';
import BasePagination from '@shared/ui/components/BasePagination.vue';

const { products, loading, error, fetchProducts } = useProduct();
const { filters, filteredProducts, applyFilters } = useProductFilters(products);

const currentPage = ref(1);
const itemsPerPage = 12;

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
});

const resetAll = () => {
  // Logic to reset filters (can be handled via emit if needed)
  window.location.reload(); 
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
</style>