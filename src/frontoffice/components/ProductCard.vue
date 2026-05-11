<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <p>{{ product.price }} €</p>
    <router-link :to="`/product/${product.id}`">Voir détail</router-link>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  product: any
}>()
</script>

<style scoped>
.product-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 4px;
}
</style>
