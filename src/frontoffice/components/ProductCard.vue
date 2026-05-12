<template>
  <div class="border rounded-lg overflow-hidden shadow hover:shadow-lg transition relative">
    <div class="absolute top-2 left-2 z-10 flex gap-1">
      <span v-if="isHot" class="badge-hot">HOT</span>
      <span v-if="isNew" class="badge-new">NEW</span>
    </div>
    <img :src="imageUrl" :alt="product.name" class="w-full h-48 object-cover" />
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-2">{{ product.name }}</h2>
      <p class="text-gray-600 mb-2">{{ product.price }} €</p>
      <button
          @click="addToCart"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Ajouter au panier
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Product } from '@shared/types/product';
import { useCart } from '@shared/composables/useCart';
import productService from '../../shared/services/product-service';

const props = defineProps<{ product: Product }>();
const { addItem } = useCart();

const imageUrl = computed(() =>
    productService.getImageUrl(props.product.id_product, props.product.id_default_image, 'medium_default')
);

const addToCart = () => {
  addItem(props.product, 1);
  alert('Produit ajouté au panier');
};

// Badges
const isHot = computed(() => {
  if (!props.product.date_availability) return false;
  const date = new Date(props.product.date_availability);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 3600 * 24));
  return diffDays === 0; // sorti aujourd'hui ou hier ? "1j avant"
});

const isNew = computed(() => {
  if (!props.product.date_availability) return false;
  const date = new Date(props.product.date_availability);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 3600 * 24));
  return diffDays <= 7 && diffDays >= 0;
});
</script>

<style scoped>
.badge-hot {
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
.badge-new {
  background-color: #3b82f6;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
</style>