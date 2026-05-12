import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@shared/types/product';
import type { CartItem } from '@shared/types/cart';

export const useCartStore = defineStore('cart', () => {
    const items = ref<CartItem[]>([]);

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => {
            const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
            return total + (price * item.quantity);
        }, 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    const isCartDrawerOpen = ref(false);
    function toggleCartDrawer() {
        isCartDrawerOpen.value = !isCartDrawerOpen.value;
    }
    function openCartDrawer() {
        isCartDrawerOpen.value = true;
    }
    function closeCartDrawer() {
        isCartDrawerOpen.value = false;
    }

    /**
     * Adds a product to the cart or increments its quantity if it already exists.
     * @param product The product to add
     * @param quantity The quantity to add (default: 1)
     */
    function addProduct(product: Product, quantity: number = 1) {
        const existingItem = items.value.find(item => String(item.product.id_product) === String(product.id_product));
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total_price = price * existingItem.quantity;
        } else {
            items.value.push({ product, quantity, total_price: price * quantity });
        }
        openCartDrawer();
    }

    /**
     * Updates the quantity of a specific product in the cart.
     * @param productId The ID of the product
     * @param quantity The new quantity
     */
    function updateQuantity(productId: string | number, quantity: number) {
        const existingItem = items.value.find(item => String(item.product.id_product) === String(productId));
        if (existingItem) {
            if (quantity <= 0) {
                removeProduct(productId);
            } else {
                existingItem.quantity = quantity;
                const price = typeof existingItem.product.price === 'string' ? parseFloat(existingItem.product.price) : existingItem.product.price;
                existingItem.total_price = price * existingItem.quantity;
            }
        }
    }

    /**
     * Removes a product from the cart completely.
     * @param productId The ID of the product to remove
     */
    function removeProduct(productId: string | number) {
        items.value = items.value.filter(item => String(item.product.id_product) !== String(productId));
    }

    function clearCart() {
        items.value = [];
    }

    return {
        items,
        totalAmount,
        totalItems,
        isCartDrawerOpen,
        toggleCartDrawer,
        openCartDrawer,
        closeCartDrawer,
        addProduct,
        updateQuantity,
        removeProduct,
        clearCart
    };
});
