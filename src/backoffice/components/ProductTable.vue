<!-- src/components/ProductTable.vue -->
<script setup lang="ts">
import type { Product } from '@shared/types/product'
defineProps<{ products: Product[] }>()
</script>

<template>
  <table>
    <thead>
    <tr><th>Id</th><th>Nom</th><th>Prix</th><th>Stock</th></tr>
    </thead>
    <tbody>
    <tr v-for="p in products" :key="p.id_product">
      <td>{{ p.id_product }}</td>
      <td>{{ p.name }}</td>
      <td>{{ p.price }}</td>
      <td>{{ p.quantity }}</td>
    </tr>
    </tbody>
  </table>
</template>