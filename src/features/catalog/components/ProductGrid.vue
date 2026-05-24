<script setup lang="ts">
import type { Product } from '@shared/models/product';
import ProductCard from '@features/catalog/components/ProductCard.vue';

interface Props {
  products: Product[];
  loading?: boolean;
  error?: string | null;
}

defineProps<Props>();
</script>

<template>
  <div class="product-grid-container">
    <!-- Loading State -->
    <div v-if="loading" class="grid-state grid-state--loading">
      <div class="loading-message">Chargement...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="grid-state grid-state--error">
      <div class="error-message">{{ error }}</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="products.length === 0" class="grid-state grid-state--empty">
      <div class="empty-message">Aucun produit disponible</div>
    </div>

    <!-- Products Grid -->
    <div v-else class="product-grid">
      <ProductCard
        v-for="product in products"
        :key="product.id_product"
        :product="product"
      />
    </div>
  </div>
</template>

<style scoped>
.product-grid-container {
  width: 100%;
}

.grid-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: var(--space-8, 2rem);
}

.grid-state--loading .loading-message,
.grid-state--error .error-message,
.grid-state--empty .empty-message {
  font-size: 1rem;
  color: var(--color-text-muted, #64748b);
}

.grid-state--error .error-message {
  color: var(--color-danger, #b00020);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
}
</style>