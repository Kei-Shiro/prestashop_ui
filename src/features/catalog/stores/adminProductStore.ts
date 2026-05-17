import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product } from '@shared/types/product';
import productService from '@features/catalog/services/product-service';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const loading = ref(false);

  async function fetchProducts() {
    loading.value = true;
    try {
      products.value = await productService.getAll();
    } catch (error) {
      console.error('Failed to fetch products', error);
      products.value = [];
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    loading,
    fetchProducts
  };
});