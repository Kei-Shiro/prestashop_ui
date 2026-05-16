import { ref } from 'vue';
import { orderService } from '../services/order-service';
import { customerService } from '@features/auth/services/customer-service';
import { useCartStore } from '@features/checkout/stores/cartStore';
import { useAuthStore } from '@features/auth/stores/customerAuthStore';
import {CheckoutForm} from "@shared/types/checkout";


export function useCheckout() {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const cartStore = useCartStore();
    const authStore = useAuthStore();

    /**
     * Trouve l'ID de l'état initial pour une nouvelle commande COD
     * Cherche "paiement à la livraison" ou "cash on delivery" en priorité
     */
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

            // Priorité 1 : état spécifique au Paiement à la livraison
            const codState = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return label.includes('livraison') || label.includes('cash');
            });
            if (codState) return Number(codState.id);

            // Priorité 2 : état "attente" générique (mais pas payé si possible)
            const pendingState = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return (label.includes('attente') || label.includes('pending')) && !label.includes('payé');
            });
            if (pendingState) return Number(pendingState.id);

            // Priorité 3 : tout état "attente"
            const anyPending = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return label.includes('attente') || label.includes('pending');
            });
            if (anyPending) return Number(anyPending.id);

            // Fallback : premier état qui n'est pas annulation/erreur
            const safeState = states.find((s: any) => {
                const label = getLabel(s).toLowerCase();
                return !label.includes('annul') && !label.includes('cancel')
                    && !label.includes('erreur') && !label.includes('error');
            });
            if (safeState) return Number(safeState.id);

            if (states.length > 0) return Number(states[0].id);
        } catch (_) { /* ignore */ }
        return 3; // valeur par défaut PS (Préparation en cours)
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
                // Récupérer l'adresse existante du client (ou en créer une)
                const addresses = await customerService.getAllAddressesByCustomerId(customerId);
                if (addresses.length > 0) {
                    addressId = Number(addresses[0].id); // cast string→number depuis l'API
                } else {
                    // Créer une adresse pour ce client
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

            // Préparer les items du panier
            const items = cartStore.items.map(item => ({
                product: item.product,
                quantity: item.quantity
            }));

            // Déterminer dynamiquement : état initial + carrier + module COD
            const [initialStateId, carrierId, moduleName] = await Promise.all([
                resolveInitialStateId(),
                orderService.detectCarrierId(),
                orderService.detectCodModuleName()
            ]);

            console.log(`[useCheckout] Création commande — state:${initialStateId} carrier:${carrierId} module:${moduleName}`);

            const cartId = await orderService.createCart(customerId, items, addressId);
            const orderId = await orderService.createOrder(customerId, cartId, cartStore.totalAmount, addressId, initialStateId, carrierId, moduleName);
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
