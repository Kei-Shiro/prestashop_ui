<template>
  <div class="shop-page">
    <div class="shop-header">
      <h1 class="shop-title">Nos produits</h1>
      <p class="shop-subtitle">Decouvrez notre collection</p>
    </div>
    
    <ProductFilters @filter="applyFilters" class="shop-filters" />
    
    <!-- Skeleton loading -->
    <div v-if="loading" class="product-grid">
      <div v-for="n in 8" :key="n" class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line medium"></div>
      </div>
    </div>
    <div v-else-if="error" class="shop-error">{{ error }}</div>
    <div v-else-if="filteredProducts.length === 0" class="no-results">
      <p class="no-results-title">Aucun produit trouve</p>
      <p class="no-results-text">Essayez de modifier vos filtres pour voir plus de produits.</p>
    </div>
    <div v-else class="product-grid">
      <ProductCard
          v-for="product in filteredProducts"
          :key="product.id_product"
          :product="product"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProduct } from '@shared/composables/useProduct';
import { useProductFilters } from '@shared/composables/useProductFilters';
import ProductCard from '@features/products/components/ProductCard.vue';
import ProductFilters from '@features/products/components/ProductFilters.vue';

const { products, loading, error, fetchProducts } = useProduct();
const { filters, filteredProducts, applyFilters } = useProductFilters(products);

onMounted(async () => {
  await fetchProducts();
  const categories = [...new Set(products.value.map(p => p.category).filter(Boolean))];
});
</script>

<style scoped>
.shop-page {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.shop-header {
  text-align: center;
  margin-bottom: 40px;
}
.shop-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}
.shop-subtitle {
  color: #666;
  font-size: 1rem;
}
.shop-filters {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.shop-error {
  color: #c00;
  text-align: center;
  padding: 80px 0;
}
.no-results {
  text-align: center;
  padding: 80px 20px;
}
.no-results-title {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 8px;
}
.no-results-text {
  color: #666;
  font-size: 0.875rem;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}

/* Skeleton */
.skeleton-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.skeleton-image {
  height: 180px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}
.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}
.skeleton-line.short { width: 40%; }
.skeleton-line.medium { width: 70%; }

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>