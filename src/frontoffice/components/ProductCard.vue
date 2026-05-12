<template>
  <div class="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div class="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75 sm:aspect-none sm:h-96">
      <img v-if="imageUrl" :src="imageUrl" :alt="product.name" class="w-full h-full object-center object-cover sm:w-full sm:h-full cursor-pointer" @click="goToProduct">
      <div v-else class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 sm:w-full sm:h-full cursor-pointer" @click="goToProduct">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      </div>
    </div>
    <div class="flex-1 p-4 space-y-2 flex flex-col">
      <h3 class="text-sm font-medium text-gray-900 cursor-pointer" @click="goToProduct">
        {{ product.name }}
      </h3>
      <p class="text-sm text-gray-500 line-clamp-2" v-html="product.description_short"></p>
      <div class="flex-1 flex flex-col justify-end">
        <p class="text-base font-medium text-gray-900 mb-4">{{ formatPrice(product.price) }} €</p>
        <button @click="addToCart" class="w-full bg-white border border-purple-600 rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          Ajouter au panier
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import type { Product } from '@shared/types/product';
import { useProduct } from '@shared/composables/useProduct';

const props = defineProps<{
  product: Product
}>();

const router = useRouter();
const cartStore = useCartStore();
const { getProductImageUrl } = useProduct();

const imageUrl = computed(() => getProductImageUrl(props.product, 'home_default'));

const formatPrice = (price: string | number) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return p.toFixed(2);
}

const goToProduct = () => {
  router.push(`/product/${props.product.id_product}`);
};

const addToCart = () => {
  cartStore.addProduct(props.product, 1);
};
</script>
