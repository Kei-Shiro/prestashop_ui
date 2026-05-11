import { defineStore } from 'pinia';

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as any[],
  }),
  actions: {
    setProducts(products: any[]) {
      this.products = products;
    }
  }
});

