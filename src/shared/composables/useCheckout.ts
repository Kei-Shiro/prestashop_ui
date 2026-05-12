import { ref } from 'vue';
import { orderService } from '../services/order-service';
import { customerService } from '../services/customer-service';
import { useCart } from './useCart';
import { useAuthStore } from '@frontoffice/stores/auth';

export interface CheckoutForm {
    email: string;
    firstname: string;
    lastname: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
}

export function useCheckout() {
    const loading = ref(false);
    const error = ref<string | null>(null);
    const { cart, clearCart } = useCart();
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
            const items = cart.value.items.map(item => ({
                productId: parseInt(item.product.id_product),
                quantity: item.quantity
            }));

            const cartId = await orderService.createCart(customerId, items);
            await orderService.createOrder(customerId, cartId, cart.value.total_price);
            clearCart();
            return cartId; // ou l'ID commande? createOrder ne retourne pas l'ID, il faudrait modifier orderService.createOrder pour retourner l'ID
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