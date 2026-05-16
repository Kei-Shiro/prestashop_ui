import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authFrontService } from '@features/auth/services/auth-front-service';
import { customerService } from '@features/auth/services/customer-service';
import { orderService } from '@features/checkout/services/order-service';
import productService from '@features/catalog/services/product-service';
import { useCartStore } from '@features/checkout/stores/cartStore';
import { extractIdValue } from '@shared/utils/extractIdValue';

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
            if (serverItems.length === 0) {
                console.log(`[authStore] Aucun article à synchroniser pour client ${customerId}`);
                return;
            }

            console.log(`[authStore] Synchronisation de ${serverItems.length} articles pour client ${customerId}`);

            // Récupérer les détails des produits pour chaque article
            const fullItems = await Promise.all(
                serverItems.map(async (si) => {
                    const cleanId = extractIdValue(si.id_product);
                    const cleanIdAttr = extractIdValue(si.id_product_attribute) || '0';
                    if (!cleanId || cleanId === 'NaN' || cleanId === '0') return null;

                    try {
                        const product = await productService.getProduct(Number(cleanId));
                        let price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);
                        
                        // Handle price for combinations
                        if (cleanIdAttr !== '0') {
                            try {
                                const combinations = await productService.getCombinations(Number(cleanId));
                                const combination = combinations.find(c => extractIdValue(c.id) === cleanIdAttr);
                                if (combination && combination.price) {
                                    const impact = typeof combination.price === 'string' ? parseFloat(combination.price) : Number(combination.price);
                                    price += impact;
                                }
                            } catch (e) {
                                console.warn(`Could not get combination ${cleanIdAttr} for product ${cleanId}`);
                            }
                        }

                        return {
                            product,
                            id_product_attribute: cleanIdAttr,
                            quantity: Number(si.quantity),
                            unit_price: price,
                            total_price: price * Number(si.quantity)
                        };
                    } catch (e) {
                        console.error(`[authStore] Failed to fetch product ${cleanId} (original: ${JSON.stringify(si.id_product)})`, e);
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
            try {
                await authFrontService.logout();
            } catch (_) { /* already handled in service */ }
        }
        user.value = null;
        isAuthenticated.value = false;
        isAnonymous.value = false;
        localStorage.removeItem('user');
        
        const cartStore = useCartStore();
        cartStore.clearAnonymousCart(); // nettoyer avant de repasser en anonyme
        cartStore.loadForUser('anonymous');
    };

    const restoreSession = async () => {
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
                    // Add cart sync here for imported carts when user refreshes page!
                    await syncServerCarts(Number(parsed.id));
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