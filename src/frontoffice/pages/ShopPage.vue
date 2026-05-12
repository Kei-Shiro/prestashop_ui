<template>
  <div class="shop-page">
    <div class="shop-header">
      <h1 class="shop-title">Nos produits</h1>
      <p class="shop-subtitle">Decouvrez notre collection</p>
    </div>
    
    <ProductFilters @filter="applyFilters" class="shop-filters" />
    
    <div v-if="loading" class="shop-loading">Chargement...</div>
    <div v-else-if="error" class="shop-error">{{ error }}</div>
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
import { useProductFilters } from '../../shared/composables/useProductFilters';
import ProductCard from '../components/ProductCard.vue';
import ProductFilters from '../components/ProductFilters.vue';

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
.shop-loading {
  text-align: center;
  padding: 80px 0;
  color: #666;
}
.shop-error {
  color: #c00;
  text-align: center;
  padding: 80px 0;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}
</style>