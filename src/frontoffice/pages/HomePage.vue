<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-gray-900">Notre Collection</h1>
      <p class="mt-2 text-sm text-gray-500">Découvrez nos derniers produits ajoutés à la boutique.</p>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <div v-else-if="products.length === 0" class="text-center py-10 text-gray-500">
      Aucun produit trouvé.
    </div>

    <div v-else class="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      <ProductCard v-for="product in products" :key="product.id_product" :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProduct } from '@shared/composables/useProduct';
import ProductCard from '../components/ProductCard.vue';

const { products, loading, error, fetchProducts } = useProduct();

onMounted(() => {
  fetchProducts();
});
</script>
