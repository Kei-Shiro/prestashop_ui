import { ref } from 'vue';
import { orderService } from '../services/order-service';
import { customerService } from '../services/customer-service';
import { useCartStore } from '@front/stores/cart';
import { useAuthStore } from '@front/stores/auth';
import {CheckoutForm} from "@shared/types/checkout";


export function useCheckout() {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const cartStore = useCartStore();
    const authStore = useAuthStore();

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
                customerId = authStore.user.id;
                // Récupérer l'adresse existante du client (ou en créer une)
                const addresses = await customerService.getAllAddressesByCustomerId(customerId);
                if (addresses.length > 0) {
                    addressId = addresses[0].id;
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

            const cartId = await orderService.createCart(customerId, items, addressId);
            const orderId = await orderService.createOrder(customerId, cartId, cartStore.totalAmount, addressId);
            cartStore.clearCart();
            return orderId;
        } catch (err) {
            error.value = 'Erreur lors de la création de la commande';
            console.error(err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return { submitOrder, loading, error };
}
