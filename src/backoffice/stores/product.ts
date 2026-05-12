import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Product } from '@shared/types/product';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);

  function setProducts(newProducts: Product[]) {
    products.value = newProducts;
  }

  return {
    products,
    setProducts
  };
});