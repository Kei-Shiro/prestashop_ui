// shared/composables/useProduct.ts
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import productService, { Product, useProductStore } from '@shared/models/product';

export function useProduct() {
    const productStore = useProductStore();
    const { products, loading } = storeToRefs(productStore);
    const error = ref<string | null>(null);
    const currentProduct = ref<Product | null>(null);

    const fetchProducts = async () => {
        error.value = null;
        try {
            await productStore.fetchProducts();
        } catch (err) {
            error.value = 'Erreur lors du chargement des produits';
            console.error(err);
        }
    };

    const fetchProduct = async (id: number) => {
        error.value = null;
        try {
            currentProduct.value = await productService.getProduct(id);
        } catch (err) {
            error.value = 'Erreur lors du chargement du produit';
            console.error(err);
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