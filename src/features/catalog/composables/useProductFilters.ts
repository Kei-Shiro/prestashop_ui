import { ref, computed, type Ref } from 'vue';
import type { Product } from '@shared/types/product';

export function useProductFilters(products: Ref<Product[]>) {
    const filters = ref({
        name: '',
        category: '',
        priceMin: null as number | null,
        priceMax: null as number | null
    });

    const filteredProducts = computed(() => {
        return products.value.filter(product => {
            // Filtre nom
            if (filters.value.name && !product.name.toLowerCase().includes(filters.value.name.toLowerCase())) {
                return false;
            }
            // Filtre catégorie
            if (filters.value.category) {
                const selectedCat = String(filters.value.category);
                const productCats = product.categories || [];
                const defaultCat = String(product.category);
                
                if (defaultCat !== selectedCat && !productCats.includes(selectedCat)) {
                    return false;
                }
            }
            // Filtre prix min
            const price = parseFloat(product.price);
            if (filters.value.priceMin !== null && price < filters.value.priceMin) {
                return false;
            }
            // Filtre prix max
            if (filters.value.priceMax !== null && price > filters.value.priceMax) {
                return false;
            }
            return true;
        });
    });

    const applyFilters = (newFilters: any) => {
        filters.value = { ...newFilters };
    };

    return { filters, filteredProducts, applyFilters };
}