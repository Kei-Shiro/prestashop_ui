import { ref } from "vue";
import { MappedOrder } from "@shared/types/order";
import { orderService } from "../services/order-service";

/*const ALLOWED_STATE_IDS = [2, 6, 13];*/ // Paiement accepté, Annulé, En attente de paiement à la livraison
const ALLOWED_STATE_IDS = [2, 5, 6];

/**
 * Avec display=full, PrestaShop renvoie les champs FK (current_state, id_customer…)
 * sous forme <current_state xlink:href="...">2</current_state>. fast-xml-parser
 * les parse en objet { '@_xlink:href': '...', '#text': 2 }. On extrait la valeur.
 */
const psNum = (v: any): number => {
    if (v && typeof v === 'object') v = v['#text'] ?? v['value'] ?? v['@_id'];
    return Number(v);
};

export function useOrders() {
    const orders = ref<MappedOrder[]>([]);
    const orderStates = ref<any[]>([]);
    const allowedStateIds = ref<number[]>(ALLOWED_STATE_IDS);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const updatingOrderId = ref<number | null>(null);

    const loadOrdersAndMetadata = async () => {

        isLoading.value = true;
        error.value = null;

        try {
            const [rawOrders, rawStates, rawCustomers] = await Promise.all([
                orderService.getOrders(),
                orderService.getOrderStates(),
                orderService.getCustomers()
            ]);

            const ordersArray = Array.isArray(rawOrders) ? rawOrders : (rawOrders ? [rawOrders] : []);
            const statesArray = Array.isArray(rawStates) ? rawStates : (rawStates ? [rawStates] : []);
            const customersArray = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers ? [rawCustomers] : []);

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

            orderStates.value = Array.from(statesMap.values());

            const customersMap = new Map();
            customersArray.forEach(customer => {
                customersMap.set(Number(customer.id), `${customer.firstname} ${customer.lastname}`);
            });

            orders.value = ordersArray.map(order => {
                const customerId = psNum(order.id_customer);
                const currentStateId = psNum(order.current_state);
                const state = statesMap.get(currentStateId) || { id: currentStateId, label: "Unknown", color: "#000000" };

                return {
                    id: Number(order.id),
                    reference: order.reference || "",
                    customerId: customerId,
                    customerName: customersMap.get(customerId) || "Unknown",
                    totalPaid: parseFloat(order.total_paid_tax_incl || order.total_paid || "0").toFixed(2),
                    payment: order.payment || "Bank wire",
                    dateAdd: order.date_add ? new Date(order.date_add).toLocaleDateString('fr-FR') : "",
                    currentState: state
                };
            });
        } catch (err) {
            console.error(err);
            error.value = "Erreur lors du chargement des commandes.";
        } finally {
            isLoading.value = false;
        }
    };

    const changeOrderStatus = async (orderId: number, newStateId: number) => {
        updatingOrderId.value = orderId;
        try {
            await orderService.updateOrderStatus(orderId, newStateId);

            // Mise à jour optimiste
            const orderIndex = orders.value.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                const newState = orderStates.value.find(s => s.id === newStateId);
                if (newState) {
                    orders.value[orderIndex].currentState = { ...newState };
                }
            }
        } catch (err) {
            console.error("Échec de la mise à jour :", err);
            throw err;
        } finally {
            updatingOrderId.value = null;
        }
    };

    return {
        orders,
        orderStates,
        allowedStateIds,
        isLoading,
        error,
        updatingOrderId,
        loadOrdersAndMetadata,
        changeOrderStatus
    };
}