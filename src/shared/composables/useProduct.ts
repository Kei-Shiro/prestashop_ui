import { ref } from 'vue';
import type { Product } from '../types/product';
import productService from '../services/product-service';

/**
 * Composable pour la gestion de la liste des produits et de leurs détails
 */
export function useProduct() {
    const products = ref<Product[]>([]);
    const currentProduct = ref<Product | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * Charge tous les produits depuis l'API
     */
    const loadProducts = async () => {
        loading.value = true;
        error.value = null;
        try {
            products.value = await productService.getAll();
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des produits';
            console.error('loadProducts error', err);
        } finally {
            loading.value = false;
        }
    };

    /**
     * Charge le détail d'un produit spécifique
     * @param id L'identifiant du produit
     */
    const loadProduct = async (id: number) => {
        loading.value = true;
        error.value = null;
        try {
            currentProduct.value = await productService.getProduct(id);
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement du produit';
            console.error('loadProduct error', err);
        } finally {
            loading.value = false;
        }
    };

    return {
        products,
        currentProduct,
        loading,
        error,
        loadProducts,
        loadProduct
    };
}