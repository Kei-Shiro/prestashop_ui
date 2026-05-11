import { ref } from 'vue';

export function useProduct() {
  const products = ref([]);

  const loadProducts = async () => {
    // Logic to load products
    products.value = [];
  };

  return { products, loadProducts };
}

