<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useProductStore } from '@shared/models/product'
import ProductTable from '@features/catalog/components/ProductTable.vue'
import BasePagination from '@shared/ui/components/BasePagination.vue'

const productStore = useProductStore()
const error = ref<string | null>(null)

const currentPage = ref(1);
const itemsPerPage = 10;

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return productStore.products.slice(start, start + itemsPerPage);
});

onMounted(async () => {
  try {
    await productStore.fetchProducts();
  } catch (err) {
    error.value = 'Erreur de chargement des produits'
    console.error(err);
  }
})
</script>

<template>
  <div class="products-page">
    <div class="page-header">
      <h1 class="page-title">Produits</h1>
      <p class="page-subtitle">{{ productStore.products.length }} produit{{ productStore.products.length !== 1 ? 's' : '' }} au total</p>
    </div>

    <div v-if="productStore.loading" class="state-loading">Chargement des produits...</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else>
      <ProductTable :products="paginatedProducts" />
      
      <BasePagination
        v-if="productStore.products.length > 0"
        v-model:current-page="currentPage"
        :total-items="productStore.products.length"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>

<style scoped>
.products-page {
  padding: 1.5rem;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}
.page-subtitle {
  color: #64748b;
  margin: 0.25rem 0 0;
}
.state-loading, .state-error {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}
.state-error {
  color: #ef4444;
}
</style>