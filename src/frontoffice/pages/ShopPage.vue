<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Nos produits</h1>
    <ProductFilters @filter="applyFilters" />
    <div v-if="loading" class="text-center">Chargement...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <ProductCard
          v-for="product in filteredProducts"
          :key="product.id_product"
          :product="product"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useProduct } from '@shared/composables/useProduct';
import { useProductFilters } from '@shared/composables/useProductFilters';
import ProductCard from '../components/ProductCard.vue';
import ProductFilters from '../components/ProductFilters.vue';

const { products, loading, error, fetchProducts } = useProduct();
const { filters, filteredProducts, applyFilters } = useProductFilters(products);

onMounted(async () => {
  await fetchProducts();
  // initialisation des catégories pour les filtres
  const categories = [...new Set(products.value.map(p => p.category).filter(Boolean))];
  // on peut passer ça au composant ProductFilters via provide/inject ou props, mais on va simplifier : ProductFilters va émettre et on applique.
});
</script>