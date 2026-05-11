import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as any[],
  }),
  actions: {
    addToCart(item: any) {
      this.items.push(item);
    }
  }
});
