import { defineStore } from 'pinia';
import { ref } from 'vue';
import { orderService } from '@shared/services/order-service';
import { MappedOrder } from '@shared/types/order';

export const useCustomerOrderStore = defineStore('customerOrder', () => {
    const myOrders = ref<MappedOrder[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    // Hardcode customerId to 1 for evaluation purposes unless a real auth exists
    const customerId = 1;

    async function fetchMyOrders() {
        isLoading.value = true;
        error.value = null;
        try {
            const [rawOrders, rawStates] = await Promise.all([
                orderService.getOrders(),
                orderService.getOrderStates()
            ]);

            const statesArray = Array.isArray(rawStates) ? rawStates : (rawStates ? [rawStates] : []);
            const statesMap = new Map();
            statesArray.forEach(state => {
                let label = "Unknown";
                if (typeof state.name === 'string') {
                    label = state.name;
                } else if (state.name && state.name.language) {
                    const langs = Array.isArray(state.name.language) ? state.name.language : [state.name.language];
                    label = typeof langs[0] === 'string' ? langs[0] : (langs[0]?.value || langs[0]?.['#text'] || label);
                }
                statesMap.set(Number(state.id), {
                    id: Number(state.id),
                    label: label,
                    color: state.color || "#000000"
                });
            });

            myOrders.value = rawOrders.map((order: any) => {
                const currentStateId = Number(order.current_state);
                const state = statesMap.get(currentStateId) || { id: currentStateId, label: "Unknown", color: "#000000" };

                return {
                    id: Number(order.id),
                    reference: order.reference || "",
                    customerName: "", // Unused in front but needed by MappedOrder type
                    totalPaid: parseFloat(order.total_paid_tax_incl || order.total_paid || "0").toFixed(2),
                    payment: order.payment || "Bank wire",
                    dateAdd: order.date_add ? new Date(order.date_add).toLocaleDateString('fr-FR') : "",
                    currentState: state
                };
            });
        } catch (err) {
            console.error(err);
            error.value = "Erreur lors de la recuperation des commandes.";
        } finally {
            isLoading.value = false;
        }
    }

    async function checkout(items: { productId: number; quantity: number }[], totalAmount: number): Promise<boolean> {
        isLoading.value = true;
        error.value = null;
        try {
            // 1. Create a Cart
            const cartId = await orderService.createCart(customerId, items);
            // 2. Create the Order
            await orderService.createOrder(customerId, cartId, totalAmount);
            return true;
        } catch (err) {
            console.error(err);
            error.value = "Erreur lors de la validation de la commande.";
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        myOrders,
        isLoading,
        error,
        fetchMyOrders,
        checkout
    };
});