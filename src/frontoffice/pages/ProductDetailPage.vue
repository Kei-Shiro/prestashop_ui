<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="text-center">Chargement...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="product" class="grid md:grid-cols-2 gap-8">
      <img :src="mainImage" :alt="product.name" class="w-full rounded" />
      <div>
        <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>
        <p class="text-2xl text-blue-600 mb-4">{{ product.price }} €</p>
        <div class="mb-4" v-html="product.description"></div>
        <div class="flex items-center gap-4 mb-6">
          <input type="number" v-model.number="quantity" min="1" class="border p-2 w-20 rounded" />
          <button @click="addToCart" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProduct } from '@shared/composables/useProduct';
import { useCart } from '@shared/composables/useCart';
import productService from '@shared/services/product-service';

const route = useRoute();
const { currentProduct, loading, error, fetchProduct } = useProduct();
const { addItem } = useCart();
const quantity = ref(1);

const product = computed(() => currentProduct.value);
const mainImage = computed(() => {
  if (product.value) {
    return productService.getImageUrl(product.value.id_product, product.value.id_default_image, 'large_default');
  }
  return '';
});

onMounted(() => {
  const id = parseInt(route.params.id as string);
  fetchProduct(id);
});

const addToCart = () => {
  if (product.value) {
    addItem(product.value, quantity.value);
    alert('Produit ajouté au panier');
  }
};
</script>