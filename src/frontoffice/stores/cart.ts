import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Product } from '@shared/types/product';
import { CartItem } from '@shared/types/cart';

/**
 * Store Pinia pour gérer le panier du FrontOffice
 */
export const useCartStore = defineStore('cart', () => {
    // État du panier
    const items = ref<CartItem[]>([]);

    /**
     * Calcule le total du panier (Prix * Quantité pour tous les articles)
     */
    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => {
            const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
            return total + (price * item.quantity);
        }, 0);
    });

    /**
     * Ajoute un produit au panier
     * @param product Le produit à ajouter
     * @param quantity La quantité à ajouter (par défaut 1)
     */
    function addProduct(product: Product, quantity: number = 1) {
        const existingItem = items.value.find(item => item.product.id_product === product.id_product);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            items.value.push({ product, quantity });
        }
    }

    /**
     * Modifie la quantité d'un produit dans le panier
     * @param productId L'ID du produit
     * @param quantity La nouvelle quantité
     */
    function updateQuantity(productId: number, quantity: number) {
        const existingItem = items.value.find(item => item.product.id_product === productId);
        if (existingItem) {
            if (quantity <= 0) {
                removeProduct(productId);
            } else {
                existingItem.quantity = quantity;
            }
        }
    }

    /**
     * Supprime un produit du panier
     * @param productId L'ID du produit à supprimer
     */
    function removeProduct(productId: number) {
        items.value = items.value.filter(item => item.product.id_product !== productId);
    }

    /**
     * Vide intégralement le panier (après une commande par exemple)
     */
    function clearCart() {
        items.value = [];
    }

    return {
        items,
        totalAmount,
        addProduct,
        updateQuantity,
        removeProduct,
        clearCart
    };
});
