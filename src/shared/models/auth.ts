import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import apiService from '@shared/api/api-service';
import { customerService } from './customer';
import { productService } from './product';
import { orderService } from './order';
import { useCartStore, cartService } from './cart';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';

export interface User {
    id: number;
    email: string;
    name: string;
    role: 'admin' | 'customer';
}

const frontApi = axios.create({
    baseURL: 'http://localhost/prestashop',
    withCredentials: true,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

export const authFrontService = {
    async login(email: string, password: string): Promise<boolean> {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);
        params.append('submitLogin', '1');

        try {
            const response = await frontApi.post('/connexion?back=my-account', params);
            const html = response.data;
            return html.includes('<title>Mon compte</title>') || html.includes('my-account');
        } catch {
            return false;
        }
    },

    async logout(): Promise<void> {
        try {
            await fetch('http://localhost/prestashop/?mylogout=', { mode: 'no-cors', credentials: 'include' });
        } catch (_) {}
    }
};

export const useAdminAuthStore = defineStore('adminAuth', () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(localStorage.getItem('admin_token'));
    const isAuthenticated = ref<boolean>(!!token.value);

    function login(newToken: string) {
        token.value = newToken;
        isAuthenticated.value = true;
        localStorage.setItem('admin_token', newToken);
    }

    function logout() {
        token.value = null;
        user.value = null;
        isAuthenticated.value = false;
        localStorage.removeItem('admin_token');
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        logout
    };
});

export const useCustomerAuthStore = defineStore('auth', () => {
    const user = ref<any>(null);
    const isAuthenticated = ref(false);
    const isAnonymous = ref(false);

    const syncServerCarts = async (customerId: number) => {
        const cartStore = useCartStore();
        try {
            const serverItems = await cartService.getOpenCartItemsForCustomer(customerId);
            if (serverItems.length === 0) {
                console.log(`[authStore] Aucun article à synchroniser pour client ${customerId}`);
                return;
            }

            const fullItems = await Promise.all(
                serverItems.map(async (si) => {
                    const cleanId = extractIdValue(si.id_product);
                    const cleanIdAttr = extractIdValue(si.id_product_attribute) || '0';
                    if (!cleanId || cleanId === 'NaN' || cleanId === '0') return null;

                    try {
                        const product = await productService.getProduct(Number(cleanId));
                        let price = typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price);
                        
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
                        console.error(`[authStore] Failed to fetch product ${cleanId}`, e);
                        return null;
                    }
                })
            );

            const validItems = fullItems.filter((i): i is NonNullable<typeof i> => i !== null);
            cartStore.mergeServerItems(validItems);
        } catch (e) {
            console.error('Cart sync failed:', e);
        }
    };

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
                cartStore.loadForUser(String(customer.id), true);
                await syncServerCarts(Number(customer.id));
                return true;
            }
        }
        return false;
    };

    const loginWithoutPassword = async (customer: any) => {
        user.value = customer;
        isAuthenticated.value = true;
        isAnonymous.value = false;
        localStorage.setItem('user', JSON.stringify(customer));
        
        const cartStore = useCartStore();
        cartStore.loadForUser(String(customer.id), true);
        await syncServerCarts(Number(customer.id));
    };

    const loginAnonymous = () => {
        user.value = null;
        isAuthenticated.value = true;
        isAnonymous.value = true;
        localStorage.removeItem('user');
        
        const cartStore = useCartStore();
        cartStore.clearAnonymousCart();
        cartStore.loadForUser('anonymous');
    };

    const logout = async () => {
        if (!isAnonymous.value) {
            try {
                await authFrontService.logout();
            } catch (_) {}
        }
        user.value = null;
        isAuthenticated.value = false;
        isAnonymous.value = false;
        localStorage.removeItem('user');
        
        const cartStore = useCartStore();
        cartStore.clearAnonymousCart();
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
                const cartStore = useCartStore();
                if (cartStore.currentUserKey !== String(parsed.id)) {
                    cartStore.loadForUser(String(parsed.id));
                    await syncServerCarts(Number(parsed.id));
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
                localStorage.removeItem('user');
            }
        } else {
            const cartStore = useCartStore();
            if (cartStore.currentUserKey === 'anonymous' && cartStore.items.length === 0) {
                cartStore.loadForUser('anonymous');
            }
        }
    };

    return { user, isAuthenticated, isAnonymous, login, loginWithoutPassword, loginAnonymous, logout, restoreSession };
});

export default useAdminAuthStore;

