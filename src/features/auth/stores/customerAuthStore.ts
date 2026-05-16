import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authFrontService } from '@features/auth/services/auth-front-service';
import { customerService } from '@features/auth/services/customer-service';
import { orderService } from '@features/checkout/services/order-service';
import productService from '@features/catalog/services/product-service';
import { useCartStore } from '@features/checkout/stores/cartStore';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null);
    const isAuthenticated = ref(false);
    const isAnonymous = ref(false);

    /**
     * Récupère les paniers ouverts sur PS et les fusionne avec le panier local.
     */
    const syncServerCarts = async (customerId: number) => {
        const cartStore = useCartStore();
        try {
            const serverItems = await orderService.getOpenCartItemsForCustomer(customerId);
            if (serverItems.length === 0) return;

            // Récupérer les détails des produits pour chaque article
            const fullItems = await Promise.all(
                serverItems.map(async (si) => {
                    try {
                        const product = await productService.getProduct(Number(si.id_product));
                        const price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);
                        return {
                            product,
                            quantity: si.quantity,
                            total_price: price * si.quantity
                        };
                    } catch (e) {
                        console.error(`Failed to fetch product ${si.id_product} for cart sync`, e);
                        return null;
                    }
                })
            );

            // Filtrer les erreurs et fusionner
            const validItems = fullItems.filter((i): i is NonNullable<typeof i> => i !== null);
            cartStore.mergeServerItems(validItems);
        } catch (e) {
            console.error('Cart sync failed:', e);
        }
    };

    // Connexion avec mot de passe (authentification réelle)
    const login = async (email: string, password: string): Promise<boolean> => {
        const success = await authFrontService.login(email, password);
        if (success) {
            const customer = await customerService.getCustomerByEmail(email);
            if (customer) {
                user.value = customer;
                isAuthenticated.value = true;
                isAnonymous.value = false;
                localStorage.setItem('user', JSON.stringify(customer));
                
                const cartStore = useCartStore();
                cartStore.loadForUser(String(customer.id), true); // true = fusionner panier anonyme
                await syncServerCarts(Number(customer.id));
                return true;
            }
        }
        return false;
    };

    // Connexion sans mot de passe (pour la sélection simplifiée)
    const loginWithoutPassword = async (customer: any) => {
        user.value = customer;
        isAuthenticated.value = true;
        isAnonymous.value = false;
        localStorage.setItem('user', JSON.stringify(customer));
        
        const cartStore = useCartStore();
        cartStore.loadForUser(String(customer.id), true); // true = fusionner panier anonyme
        await syncServerCarts(Number(customer.id));
    };

    const loginAnonymous = () => {
        user.value = null;
        isAuthenticated.value = true;   // on considère qu'il est "connecté" en tant qu'anonyme
        isAnonymous.value = true;
        localStorage.removeItem('user');
        
        const cartStore = useCartStore();
        cartStore.clearAnonymousCart(); // repartir à zéro pour un nouveau visiteur
        cartStore.loadForUser('anonymous');
    };

    const logout = async () => {
        if (!isAnonymous.value) {
            await authFrontService.logout();
        }
        user.value = null;
        isAuthenticated.value = false;
        isAnonymous.value = false;
        localStorage.removeItem('user');
        
        const cartStore = useCartStore();
        cartStore.clearAnonymousCart(); // nettoyer avant de repasser en anonyme
        cartStore.loadForUser('anonymous');
    };

    const restoreSession = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                user.value = parsed;
                isAuthenticated.value = true;
                isAnonymous.value = false;
                // Restaurer le panier de l'utilisateur si pas encore chargé
                const cartStore = useCartStore();
                if (cartStore.currentUserKey !== String(parsed.id)) {
                    cartStore.loadForUser(String(parsed.id));
                    // Note: restoreSession est synchrone, on ne peut pas await syncServerCarts ici sans refactor.
                    // Mais loadForUser restaure déjà le localStorage local.
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.removeItem('user');
            }
        } else {
            // Pas d'utilisateur → charger le panier anonyme si nécessaire
            const cartStore = useCartStore();
            if (cartStore.currentUserKey === 'anonymous' && cartStore.items.length === 0) {
                cartStore.loadForUser('anonymous');
            }
        }
    };

    return { user, isAuthenticated, isAnonymous, login, loginWithoutPassword, loginAnonymous, logout, restoreSession };
});
