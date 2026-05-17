import { defineStore } from 'pinia';
import { ref } from 'vue';
import { orderService } from '@features/checkout/services/order-service';
import { MappedOrder } from '@shared/types/order';

// Raw order from API before mapping
interface RawOrder {
    id: string;
    reference?: string;
    current_state: string | number;
    total_paid_tax_incl?: string;
    total_paid?: string;
    payment?: string;
    date_add?: string;
}

export const useCustomerOrderStore = defineStore('customerOrder', () => {
    const myOrders = ref<MappedOrder[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);

    async function fetchMyOrders() {
        isLoading.value = true;
        error.value = null;
        try {
            const [rawOrders, rawStates] = await Promise.all([
                orderService.getOrders(),
                orderService.getOrderStates()
            ]);

            const statesArray = Array.isArray(rawStates) ? rawStates : (rawStates ? [rawStates] : []);
            const statesMap = new Map<number, { id: number; label: string; color: string }>();
            statesArray.forEach((state: Record<string, unknown>) => {
                let label = "Unknown";
                if (typeof state.name === 'string') {
                    label = state.name;
                } else if (state.name && typeof state.name === 'object' && 'language' in state.name) {
                    const nameObj = state.name as { language: unknown };
                    const langs = Array.isArray(nameObj.language) ? nameObj.language : [nameObj.language];
                    const firstLang = langs[0];
                    if (typeof firstLang === 'string') {
                        label = firstLang;
                    } else if (firstLang && typeof firstLang === 'object') {
                        const langObj = firstLang as Record<string, unknown>;
                        label = (langObj.value as string) || (langObj['#text'] as string) || label;
                    }
                }
                statesMap.set(Number(state.id), {
                    id: Number(state.id),
                    label: label,
                    color: (state.color as string) || "#000000"
                });
            });

            myOrders.value = (rawOrders as RawOrder[]).map((order) => {
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

    return {
        myOrders,
        isLoading,
        error,
        fetchMyOrders
    };
});