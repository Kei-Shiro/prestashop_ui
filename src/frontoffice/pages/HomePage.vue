<template>
  <div class="home">
    <h1>Accueil</h1>
    <div class="products">
      <!-- Mocks for now -->
      <ProductCard v-for="p in products" :key="p.id" :product="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProductCard from '../components/ProductCard.vue';

const products = ref([
  { id: 1, name: 'Produit 1', price: 10 },
  { id: 2, name: 'Produit 2', price: 20 },
]);
</script>

<style scoped>
.products {
  display: flex;
  gap: 1rem;
}
</style>
