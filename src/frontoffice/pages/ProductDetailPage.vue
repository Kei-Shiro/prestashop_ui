<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <div v-else-if="currentProduct" class="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
      <!-- Image gallery -->
      <div class="flex flex-col-reverse">
        <div class="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          <img v-if="imageUrl" :src="imageUrl" :alt="currentProduct.name" class="w-full h-full object-center object-cover">
          <svg v-else class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
      </div>

      <!-- Product info -->
      <div class="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">{{ currentProduct.name }}</h1>
        
        <div class="mt-3">
          <h2 class="sr-only">Product information</h2>
          <p class="text-3xl text-gray-900">{{ formatPrice(currentProduct.price) }} €</p>
        </div>

        <div class="mt-6">
          <h3 class="sr-only">Description</h3>
          <div class="text-base text-gray-700 space-y-6" v-html="currentProduct.description"></div>
        </div>

        <form class="mt-6" @submit.prevent="addToCart">
          <div class="mt-4 flex sm:flex-col1">
            <button type="submit" class="max-w-xs flex-1 bg-purple-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-purple-500 sm:w-full">
              Ajouter au panier
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProduct } from '@shared/composables/useProduct';
import { useCartStore } from '../stores/cart';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const { currentProduct, loading, error, fetchProduct, getProductImageUrl } = useProduct();

const imageUrl = computed(() => {
  if (!currentProduct.value) return '';
  return getProductImageUrl(currentProduct.value, 'large_default');
});

const formatPrice = (price: string | number) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return !isNaN(p) ? p.toFixed(2) : '0.00';
}

const addToCart = () => {
  if (currentProduct.value) {
    cartStore.addProduct(currentProduct.value, 1);
  }
};

watch(
  () => route.params.id,
  (newId) => {
    const id = Number(newId);
    if (id) {
      fetchProduct(id);
    } else if (newId) {
       router.push('/');
    }
  },
  { immediate: true }
);
</script>
