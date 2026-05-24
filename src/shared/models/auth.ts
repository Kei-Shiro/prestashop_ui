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
    }

    function logout() {
        token.value = null;
        user.value = null;
        isAuthenticated.value = false;
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

export const authFrontStore = useCustomerAuthStore;

// --- Reset Database Service (Admin Utility) ---
import { erasableEndpoints } from '@shared/utils/endpoints';

const toNum = (v: any): number => Number(extractIdValue(v)) || 0;

function extractList(res: any, endpoint: string): any[] {
    const container = res?.prestashop?.[endpoint.slice(1)];
    if (!container || typeof container !== 'object') return [];
    const childKey = Object.keys(container).find(k => !k.startsWith('@_'));
    const list = childKey ? container[childKey] : [];
    return ensureArray(list);
}

const specialHandlingEndpoints: Record<string, {
    action: string;
    filter?: string;
    note: string;
}> = {
    '/categories': {
        action: 'delete_filtered',
        filter: 'id=![1|2]',
        note: 'Garder Root (1) et Home (2) — hardcodés dans le core',
    },
    '/addresses': {
        action: 'delete_filtered',
        filter: 'id_customer=![0]',
        note: 'Garder adresses système (shops, warehouses)',
    },
    '/stock_availables': {
        action: 'put_quantity_zero',
        note: 'NE JAMAIS DELETE — PUT quantity=0',
    },
};

async function deleteAll(endpoint: string): Promise<string[]> {
    let items: any[];

    if (endpoint === '/stockmvtapi/stockmvt') {
        try {
            const res: any = await apiService.get('/stock_movements?display=[id]');
            items = res?.prestashop?.stock_mvts?.stock_mvt || [];
            
            console.log(`[resetService] ${items.length} mouvements de stock à supprimer via module API`);
            
            for (const item of items) {
                const id = extractIdValue(item?.id);
                if (id) {
                    try {
                        await apiService.delete(`/stock_movements/${id}`);
                    } catch (err) {
                        console.warn(`[resetService] Échec suppression mouvement ${id}`, err);
                    }
                }
            }
            return [];
        } catch (error) {
            console.warn(`[resetService] Initialisation reset ${endpoint} échouée`, error);
            return [];
        }
    }
    try {
        const res: any = await apiService.get(`${endpoint}?display=[id]`);
        items = extractList(res, endpoint);
    } catch (error) {
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error);
        return [];
    }
    items.sort((a: any, b: any) => Number(extractIdValue(a?.id)) - Number(extractIdValue(b?.id)));
    const failedIds: string[] = [];
    for (const item of items) {
        const id = extractIdValue(item?.id);
        if (!id) continue;

        try {
            await apiService.delete(`${endpoint}/${id}`);
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${id}`, error);
            failedIds.push(id);
        }
    }
    return failedIds;
}

async function deleteFiltered(endpoint: string, filterStr: string): Promise<string[]> {
    const match = filterStr.match(/^(\w+)=!\[(.*)\]$/);
    if (!match) {
        console.warn(`Filtre non supporté pour ${endpoint}: ${filterStr}, suppression totale`);
        return deleteAll(endpoint);
    }
    const [, field, excludedRaw] = match;
    const excludedIds = new Set(excludedRaw.split('|').map(s => s.trim()));

    const displayFields = field === 'id' ? '[id]' : `[id,${field}]`;
    let items: any[];
    try {
        const res: any = await apiService.get(`${endpoint}?display=${displayFields}`);
        items = extractList(res, endpoint);
    } catch (error) {
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error);
        return [];
    }
    items.sort((a: any, b: any) => Number(extractIdValue(a?.id)) - Number(extractIdValue(b?.id)));
    const failedIds: string[] = [];
    for (const item of items) {
        const id = extractIdValue(item?.id);
        if (!id) continue;

        const fieldValue = extractIdValue(item?.[field]);

        if (excludedIds.has(fieldValue)) {
            console.log(`Gardé (exclu) : ${endpoint}/${id} (car ${field}=${fieldValue})`);
            continue;
        }
        try {
            await apiService.delete(`${endpoint}/${id}`);
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${id}`, error);
            failedIds.push(id);
        }
    }
    return failedIds;
}

async function putQuantityZero(endpoint: string): Promise<string[]> {
    let items: any[];
    try {
        const res: any = await apiService.get(`${endpoint}?display=full`);
        items = extractList(res, endpoint);
    } catch (error) {
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error);
        return [];
    }
    const failedIds: string[] = [];

    for (const item of items) {
        if (!item.id) continue;
        try {
            const patchData = { id: toNum(item.id), quantity: 0 };
            await apiService.patch(`${endpoint}/${patchData.id}`, { stock_available: patchData });
            console.log(`Stock ${item.id} mis à 0`);
        } catch (error) {
            console.warn(`Failed to set quantity=0 for ${endpoint}/${item.id}`, error);
            failedIds.push(item.id);
        }
    }
    return failedIds;
}

async function resetEndpoint(endpoint: string): Promise<{ endpoint: string; failed: string[] }> {
    const special = specialHandlingEndpoints[endpoint];
    let failed: string[] = [];

    if (special) {
        console.log(`Traitement spécial pour ${endpoint} → ${special.action}`);
        switch (special.action) {
            case 'delete_filtered':
                if (special.filter) {
                    failed = await deleteFiltered(endpoint, special.filter);
                } else {
                    console.warn(`Pas de filtre pour ${endpoint}, suppression totale`);
                    failed = await deleteAll(endpoint);
                }
                break;
            case 'put_quantity_zero':
                failed = await putQuantityZero(endpoint);
                break;
            default:
                console.warn(`Action spéciale inconnue pour ${endpoint}: ${special.action}, fallback deleteAll`);
                failed = await deleteAll(endpoint);
        }
    } else {
        failed = await deleteAll(endpoint);
    }

    return { endpoint, failed };
}

const MAIN_ENDPOINTS = erasableEndpoints;

export const resetService = {
    async resetAll(): Promise<void> {
        let hasFailures = false;
        const processed = new Set<string>();

        for (const ep of MAIN_ENDPOINTS) {
            try {
                const { failed } = await resetEndpoint(ep);
                if (failed.length > 0) hasFailures = true;
            } catch (error) {
                console.error(`resetEndpoint(${ep}) a échoué — on poursuit`, error);
                hasFailures = true;
            }
            processed.add(ep);
        }

        for (const ep of Object.keys(specialHandlingEndpoints)) {
            if (!processed.has(ep)) {
                console.log(`Endpoint spécial supplémentaire (hors erasableEndpoints) : ${ep}`);
                try {
                    const { failed } = await resetEndpoint(ep);
                    if (failed.length > 0) hasFailures = true;
                } catch (error) {
                    console.error(`resetEndpoint(${ep}) a échoué — on poursuit`, error);
                    hasFailures = true;
                }
            }
        }

        if (hasFailures) {
            console.log("Certains éléments n'ont pas pu être traités – deuxième passe générale...");
            for (const ep of MAIN_ENDPOINTS) {
                await resetEndpoint(ep);
            }
            for (const ep of Object.keys(specialHandlingEndpoints)) {
                if (!processed.has(ep)) {
                    await resetEndpoint(ep);
                }
            }
        }
    },
};

// Default export of adminAuthStore as default or similar, or just default to resetService? No, keep it as is.
export default useAdminAuthStore;

