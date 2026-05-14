<template>
  <div class="shop-page">
    <div class="shop-header">
      <h1 class="shop-title">Nos collections</h1>
      <p class="shop-subtitle">Découvrez notre sélection exclusive</p>
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
      <p class="no-results-title">Aucun produit trouvé</p>
      <p class="no-results-text">Essayez de modifier vos filtres pour découvrir d'autres pièces.</p>
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
  padding: 4rem 2rem;
  max-width: 1280px;
  margin: 0 auto;
}
.shop-header {
  text-align: center;
  margin-bottom: 4rem;
}
.shop-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #1a1a2e;
}
.shop-subtitle {
  font-family: 'Outfit', sans-serif;
  color: #555;
  font-size: 1rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.shop-filters {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.shop-error {
  color: #8b0000;
  text-align: center;
  padding: 5rem 0;
  font-family: 'Outfit', sans-serif;
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
}
.no-results {
  text-align: center;
  padding: 5rem 2rem;
}
.no-results-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  color: #1a1a2e;
  margin-bottom: 0.75rem;
}
.no-results-text {
  font-family: 'Outfit', sans-serif;
  color: #666;
  font-size: 0.9rem;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2.5rem;
}

/* Skeleton - Refined */
.skeleton-card {
  background: transparent;
  padding: 0;
}
.skeleton-image {
  height: 350px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eaeaea 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s infinite;
  margin-bottom: 1rem;
}
.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eaeaea 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 2s infinite;
  margin-bottom: 0.75rem;
}
.skeleton-line.short { width: 30%; }
.skeleton-line.medium { width: 60%; }

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>