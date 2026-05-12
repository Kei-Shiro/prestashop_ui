// shared/composables/useProduct.ts
import { ref } from 'vue';
import productService from '../services/product-service';
import type { Product } from '../types/product';

export function useProduct() {
    const products = ref<Product[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const currentProduct = ref<Product | null>(null);

    const fetchProducts = async () => {
        loading.value = true;
        error.value = null;
        try {
            products.value = await productService.getAll();
        } catch (err) {
            error.value = 'Erreur lors du chargement des produits';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const fetchProduct = async (id: number) => {
        loading.value = true;
        error.value = null;
        try {
            currentProduct.value = await productService.getProduct(id);
        } catch (err) {
            error.value = 'Erreur lors du chargement du produit';
            console.error(err);
        } finally {
            loading.value = false;
        }
    };

    const getProductImageUrl = (product: Product): string => {
        if (product.id_default_image) {
            return productService.getImageUrl(product.id_product, product.id_default_image);
        }
        return '';
    };

    return {
        products,
        currentProduct,
        loading,
        error,
        fetchProducts,
        fetchProduct,
        getProductImageUrl
    };
}