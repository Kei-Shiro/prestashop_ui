<!-- src/components/ProductTable.vue -->
<script setup lang="ts">
import type { Product } from '../types/product'
defineProps<{ products: Product[] }>()
</script>

<template>
  <table>
    <thead>
    <tr><th>Id</th><th>Nom</th><th>Prix</th></tr>
    </thead>
    <tbody>
    <tr v-for="p in products" :key="p.id_product">
      <td>{{ p.id_product }}</td>
      <td>{{ p.name }}</td>
      <td>{{ p.price }}</td>
    </tr>
    </tbody>
  </table>
</template>