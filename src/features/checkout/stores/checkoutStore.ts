import { defineStore } from 'pinia';
import { ref } from 'vue';
import { orderService } from '@features/checkout/services/order-service';
import { useCartStore } from './cartStore';

export const useCheckoutStore = defineStore('checkout', () => {
    const isProcessing = ref(false);
    const error = ref<string | null>(null);
    const orderSuccess = ref(false);

    // Hardcode customerId to 1 for evaluation
    const customerId = 1;

    async function placeOrder() {
        if (isProcessing.value) return false;
        const cartStore = useCartStore();
        if (cartStore.items.length === 0) return false;

        isProcessing.value = true;
        error.value = null;
        orderSuccess.value = false;

        try {
            const itemsForApi = cartStore.items.map((item: any) => ({
                product: { id_product: Number(item.product.id_product) },
                quantity: item.quantity
            }));

            // 1. Create a Cart in backend
            const cartId = await orderService.createCart(customerId, itemsForApi);
            // 2. Create the Order in backend
            await orderService.createOrder(customerId, cartId, itemsForApi, cartStore.totalAmount);
            
            cartStore.clearCart();
            orderSuccess.value = true;
            return true;
        } catch (err) {
            console.error(err);
            error.value = "Erreur lors de la validation de la commande.";
            return false;
        } finally {
            isProcessing.value = false;
        }
    }

    function reset() {
        isProcessing.value = false;
        error.value = null;
        orderSuccess.value = false;
    }

    return {
        isProcessing,
        error,
        orderSuccess,
        placeOrder,
        reset
    };
});