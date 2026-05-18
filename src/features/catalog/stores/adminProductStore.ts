import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product } from '@shared/types/product';
import productService from '@features/catalog/services/product-service';
import { withLoading } from '@shared/utils/asyncUtils';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);

  async function fetchProducts() {
    await withLoading(loading, async () => {
      products.value = await productService.getAll();
    });
  }

  return {
    products,
    loading,
    fetchProducts
  };
});