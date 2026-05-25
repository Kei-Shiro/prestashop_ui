import { ref, computed } from "vue";
import { MappedOrder, orderService, useOrderStore } from '@shared/models/order';
import { customerService } from '@shared/models/customer';
import { ensureArray } from '@shared/utils/arrayUtils';
import { extractIdNumber } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { formatForDisplay } from '@shared/utils/dateUtils';

const ALLOWED_STATE_IDS = [5, 6];

export function useOrders() {
    const orderStore = useOrderStore();
    const orderStates = ref<any[]>([]);
    const allowedStateIds = ref<number[]>(ALLOWED_STATE_IDS);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const updatingOrderId = ref<number | null>(null);

    const customersMap = ref<Map<number, string>>(new Map());
    const statesMap = ref<Map<number, any>>(new Map());

    const loadOrdersAndMetadata = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const [, rawStates] = await Promise.all([
                orderStore.fetchOrders(),
                orderService.getOrderStates()
            ]);

            const statesArr = ensureArray(rawStates);
            const newStatesMap = new Map();
            statesArr.forEach(state => {
                const label = extractLanguageValue(state.name) || "Unknown";
                newStatesMap.set(Number(state.id), {
                    id: Number(state.id),
                    label: label,
                    color: state.color || "#000000"
                });
            });
            statesMap.value = newStatesMap;
            orderStates.value = Array.from(newStatesMap.values());

            // Get unique customer IDs from fetched orders
            const customerIds = [
                ...new Set(orderStore.orders.map(o => extractIdNumber(o.id_customer)).filter(id => id > 0))
            ];

            // Fetch only specific customers
            const rawCustomers = await customerService.getCustomersByIds(customerIds);
            const customersArray = ensureArray(rawCustomers);

            const newCustomersMap = new Map();
            customersArray.forEach(customer => {
                newCustomersMap.set(Number(customer.id), `${customer.firstname} ${customer.lastname}`);
            });
            customersMap.value = newCustomersMap;

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

            // Update state in orderStore reactively
            const orderIndex = orderStore.orders.findIndex(o => Number(o.id) === orderId);
            if (orderIndex !== -1) {
                orderStore.orders[orderIndex].current_state = String(newStateId);
            }
        } catch (err) {
            console.error("Échec de la mise à jour :", err);
            throw err;
        } finally {
            updatingOrderId.value = null;
        }
    };

    const orders = computed<MappedOrder[]>(() => {
        return orderStore.orders.map(order => {
            const customerId = extractIdNumber(order.id_customer);
            const currentStateId = extractIdNumber(order.current_state);
            const state = statesMap.value.get(currentStateId) || { id: currentStateId, label: "Unknown", color: "#000000" };

            return {
                id: Number(order.id),
                reference: order.reference || "",
                customerId: customerId,
                customerName: customersMap.value.get(customerId) || "Unknown",
                totalPaid: parseFloat(order.total_paid_tax_incl || order.total_paid || "0").toFixed(2),
                payment: order.payment || "Bank wire",
                dateAdd: formatForDisplay(order.date_add),
                currentState: state
            };
        });
    });

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