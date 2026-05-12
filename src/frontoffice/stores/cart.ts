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

    function addProduct(product: Product, quantity: number = 1) {
        const existingItem = items.value.find(item => item.product.id_product === product.id_product);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
            items.value.push({ product, quantity, total_price: price * quantity });
        }
        openCartDrawer();
    }

    function updateQuantity(productId: string | number, quantity: number) {
        const existingItem = items.value.find(item => item.product.id_product === String(productId));
        if (existingItem) {
            if (quantity <= 0) {
                removeProduct(productId);
            } else {
                existingItem.quantity = quantity;
            }
        }
    }

    function removeProduct(productId: string | number) {
        items.value = items.value.filter(item => item.product.id_product !== String(productId));
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
