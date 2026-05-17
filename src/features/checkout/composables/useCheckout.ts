import { ref } from 'vue';
import { orderService } from '../services/order-service';
import { customerService } from '@features/auth/services/customer-service';
import { useCartStore } from '@features/checkout/stores/cartStore';
import { useAuthStore } from '@features/auth/stores/customerAuthStore';
import { CheckoutForm } from "@shared/types/checkout";
import { extractIdValue } from '@shared/utils/extractIdValue';

export function useCheckout() {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const cartStore = useCartStore();
    const authStore = useAuthStore();

    const resolveInitialStateId = async (): Promise<number> => {
        try {
            const allStates = await orderService.getOrderStates();
            const states = Array.isArray(allStates) ? allStates : (allStates ? [allStates] : []);

            const getLabel = (s: any): string => {
                if (typeof s.name === 'string') return s.name;
                if (s.name?.language) {
                    const langs = Array.isArray(s.name.language) ? s.name.language : [s.name.language];
                    const first = langs[0];
                    return typeof first === 'string' ? first : (first?.value || first?.['#text'] || '');
                }
                return '';
            };

            const codState = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return label.includes('livraison') || label.includes('cash on delivery');
            });
            if (codState) return Number(extractIdValue(codState.id));

            const pendingState = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return label.includes('attente') || label.includes('pending');
            });
            if (pendingState) return Number(extractIdValue(pendingState.id));

            return 3;
        } catch (_) { /* ignore */ }
        return 3;
    };

    const submitOrder = async (form: CheckoutForm) => {
        loading.value = true;
        error.value = null;
        try {
            let customerId: number;
            let addressId: number;

            if (authStore.isAnonymous) {
                // Créer un client anonyme (guest)
                const guestEmail = form.email || `guest-${Date.now()}@example.com`;
                customerId = await customerService.createCustomer({
                    email: guestEmail,
                    firstname: form.firstname,
                    lastname: form.lastname,
                    password: Math.random().toString(36).slice(2)
                });
                addressId = await customerService.createAddress({
                    alias: 'Mon adresse',
                    firstname: form.firstname,
                    lastname: form.lastname,
                    address1: form.address,
                    city: form.city,
                    postal_code: form.postal_code,
                    phone: form.phone,
                    id_country: 8,
                    id_customer: customerId
                });
            } else {
                customerId = Number(authStore.user.id);
                const addresses = await customerService.getAllAddressesByCustomerId(customerId);
                if (addresses.length > 0) {
                    addressId = Number(extractIdValue(addresses[0].id));
                } else {
                    addressId = await customerService.createAddress({
                        alias: 'Mon adresse',
                        firstname: authStore.user.firstname,
                        lastname: authStore.user.lastname,
                        address1: form.address,
                        city: form.city,
                        postal_code: form.postal_code,
                        phone: form.phone,
                        id_country: 8,
                        id_customer: customerId
                    });
                }
            }

            const items = cartStore.items.map(item => ({
                id_product: extractIdValue(item.product.id_product),
                id_product_attribute: extractIdValue(item.id_product_attribute || '0'),
                quantity: item.quantity
            }));

            const [initialStateId, carrierId, moduleName] = await Promise.all([
                resolveInitialStateId(),
                orderService.detectCarrierId(),
                orderService.detectCodModuleName()
            ]);

            let totalToUse = cartStore.totalAmount;
            if (totalToUse === 0 && items.length > 0) {
                totalToUse = cartStore.items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
            }

            const existingCartId = await orderService.getLatestOpenCartId(customerId);
            let cartId: number;

            if (existingCartId) {
                cartId = await orderService.updateCart(existingCartId, customerId, items, addressId);
            } else {
                cartId = await orderService.createCart(customerId, items, addressId);
            }

            const orderId = await orderService.createOrder(customerId, cartId, items, totalToUse, addressId, initialStateId, carrierId, moduleName);
            await orderService.updateOrderStatus(orderId, initialStateId);

            cartStore.clearCart();
            return orderId;
        } catch (err: any) {
            error.value = err?.message || 'Erreur lors de la création de la commande';
            console.error(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return { submitOrder, loading, error };
}