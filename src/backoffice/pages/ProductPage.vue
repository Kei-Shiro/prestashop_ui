<!-- src/pages/ProductsPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '@shared/api/api-service'
import ProductTable from '@features/catalog/components/ProductTable.vue'
import type { Product } from '@shared/types/product'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await apiService.get('/products?display=[id,name,price]')
    let list = res?.prestashop?.products?.product ?? []
    if (!Array.isArray(list)) list = [list]

    products.value = list.map((p: any) => ({
      id_product: Number(p.id),
      name: Array.isArray(p.name?.language) ? p.name.language[0] : p.name?.language ?? '',
      price: p.price,
    }))
  } catch {
    error.value = 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <p v-if="loading">Chargement...</p>
    <p v-else-if="error">{{ error }}</p>
    <ProductTable v-else :products="products" />
  </div>
</template>