import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@shared/types/product';
import type { Cart, CartRow, CartCreatePayload, CartUpdatePayload } from '@shared/types/cart';
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { toPrestashopDate } from '@shared/utils/dateUtils';

// Re-export canonical types for consumers
export type { Cart, CartRow } from '@shared/types/cart';

const STORAGE_PREFIX = 'front_cart_';

/**
 * UI-level cart item — wraps the normalized Product with quantity and price info.
 * Lives in the front-office cart store only.
 */
export interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    total_price: number;
    id_product_attribute?: string;
}

export const cartService = {
    async getCarts(): Promise<Cart[]> {
        const response = await apiService.get<any>('/carts?display=full');
        return ensureArray(response.prestashop?.carts?.cart);
    },

    async getOpenCartItemsForCustomer(
        customerId: number
    ): Promise<Array<{ id_product: string; id_product_attribute: string; quantity: number }>> {
        try {
            const resOrders = await apiService.get<any>(`/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`);
            const orders = ensureArray(resOrders?.prestashop?.orders?.order);
            const usedCartIds = new Set(orders.map((o: any) => extractIdValue(o.id_cart)).filter(Boolean));

            const cartsRes = await apiService.get<any>(`/carts?filter[id_customer]=${customerId}&display=full`);
            const cartsArr = ensureArray(cartsRes?.prestashop?.carts?.cart);

            const aggregatedItems = new Map<string, number>();

            for (const cart of cartsArr) {
                if (usedCartIds.has(extractIdValue(cart.id))) continue;

                const rowsArr = ensureArray(cart.associations?.cart_rows?.cart_row);

                rowsArr.forEach((r: any) => {
                    const id = extractIdValue(r.id_product);
                    const id_attr = extractIdValue(r.id_product_attribute) || '0';
                    const qty = Number(extractIdValue(r.quantity));
                    if (id && id !== '0' && qty > 0) {
                        const key = `${id}_${id_attr}`;
                        aggregatedItems.set(key, (aggregatedItems.get(key) || 0) + qty);
                    }
                });
            }

            if (aggregatedItems.size > 0) {
                return Array.from(aggregatedItems.entries()).map(([key, quantity]) => {
                    const [id_product, id_product_attribute] = key.split('_');
                    return { id_product, id_product_attribute, quantity };
                });
            }
        } catch (e) {
            console.warn('[cartService] getOpenCartItemsForCustomer failed:', e);
        }
        return [];
    },

    async getLatestOpenCartId(customerId: number): Promise<number | null> {
        try {
            const resOrders = await apiService.get<any>(`/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`);
            const orders = ensureArray(resOrders?.prestashop?.orders?.order);
            const usedCartIds = new Set(orders.map((o: any) => extractIdValue(o.id_cart)).filter(Boolean));

            const cartsRes = await apiService.get<any>(`/carts?filter[id_customer]=${customerId}&sort=[id_DESC]&display=[id]`);
            const cartsArr = ensureArray(cartsRes?.prestashop?.carts?.cart);

            for (const cart of cartsArr) {
                const id = extractIdValue(cart.id);
                if (id && !usedCartIds.has(id)) return Number(id);
            }
        } catch (e) {
            console.warn('[cartService] getLatestOpenCartId failed:', e);
        }
        return null;
    },

    async detectCarrierId(): Promise<number> {
        try {
            const response = await apiService.get<any>('/carriers?display=full&filter[active]=1&filter[deleted]=0');
            const arr = ensureArray(response?.prestashop?.carriers?.carrier);
            const active = arr.find((c: any) => String(c.active) === '1' && String(c.deleted) !== '1');
            if (active) return Number(active.id);
        } catch (e) {
            console.warn('[cartService] detectCarrierId failed, using 1', e);
        }
        return 1;
    },

    async createCart(
        customerId: number,
        items: Array<{ id_product: string | number; id_product_attribute: string | number; quantity: number }>,
        addressId = 0
    ): Promise<number> {
        const carrierId = await this.detectCarrierId();
        const now = toPrestashopDate(new Date());

        const payload: { cart: CartCreatePayload } = {
            cart: {
                id_customer: customerId,
                id_address_delivery: addressId,
                id_address_invoice: addressId,
                id_currency: 1,
                id_lang: 1,
                id_shop: 1,
                id_shop_group: 1,
                id_carrier: carrierId,
                date_add: now,
                date_upd: now,
            }
        };

        if (items.length > 0) {
            payload.cart.associations = {
                cart_rows: {
                    cart_row: items.map(item => ({
                        id_product: item.id_product,
                        id_product_attribute: item.id_product_attribute || 0,
                        id_address_delivery: addressId,
                        id_customization: 0,
                        quantity: item.quantity
                    }))
                }
            };
        }

        const response = await apiService.post<any>('/carts', payload);
        return parseInt(extractIdValue(response.prestashop.cart.id));
    },

    async updateCart(
        cartId: number,
        customerId: number,
        items: Array<{ id_product: string | number; id_product_attribute: string | number; quantity: number }>,
        addressId = 0
    ): Promise<number> {
        const carrierId = await this.detectCarrierId();
        const now = toPrestashopDate(new Date());

        const payload: { cart: CartUpdatePayload } = {
            cart: {
                id: cartId,
                id_customer: customerId,
                id_address_delivery: addressId,
                id_address_invoice: addressId,
                id_currency: 1,
                id_lang: 1,
                id_shop: 1,
                id_shop_group: 1,
                id_carrier: carrierId,
                date_upd: now,
                associations: { cart_rows: { cart_row: [] } }
            }
        };

        if (items.length > 0) {
            payload.cart.associations!.cart_rows.cart_row = items.map(item => ({
                id_product: item.id_product,
                id_product_attribute: item.id_product_attribute || 0,
                id_address_delivery: addressId,
                id_customization: 0,
                quantity: item.quantity
            }));
        } else {
            (payload.cart as any).associations.cart_rows = '';
        }

        await apiService.put(`/carts/${cartId}`, payload);
        return cartId;
    }
};

export const useCartStore = defineStore('cart', () => {
    const currentUserKey = ref<string>('anonymous');
    const items = ref<CartItem[]>([]);

    function findItem(productId: string | number, id_product_attribute = '0') {
        return items.value.find(
            i => String(i.product.id_product) === String(productId) &&
                 String(i.id_product_attribute || '0') === String(id_product_attribute || '0')
        );
    }

    function _saveToStorage() {
        try {
            localStorage.setItem(STORAGE_PREFIX + currentUserKey.value, JSON.stringify(items.value));
        } catch (_) {}
    }

    async function syncToServer() {
        if (currentUserKey.value === 'anonymous') return;
        const customerId = Number(currentUserKey.value);
        if (!customerId || isNaN(customerId)) return;

        const cartItems = items.value.map(item => ({
            id_product: extractIdValue(item.product.id_product),
            id_product_attribute: extractIdValue(item.id_product_attribute || '0'),
            quantity: item.quantity
        }));

        try {
            const existingCartId = await cartService.getLatestOpenCartId(customerId);
            const addressId = 0;
            if (existingCartId) {
                await cartService.updateCart(existingCartId, customerId, cartItems, addressId);
            } else if (cartItems.length > 0) {
                await cartService.createCart(customerId, cartItems, addressId);
            }
        } catch (e) {
            console.error('[cartStore] Erreur lors de la synchronisation du panier avec PS:', e);
        }
    }

    function loadForUser(userKey: string, mergeAnonymous = false) {
        const anonymousItems = (mergeAnonymous && currentUserKey.value === 'anonymous') ? [...items.value] : [];
        _saveToStorage();
        currentUserKey.value = userKey;

        try {
            const stored = localStorage.getItem(STORAGE_PREFIX + userKey);
            const loadedItems = stored ? (JSON.parse(stored) as CartItem[]) : [];
            items.value = loadedItems.map(item => {
                if (item.unit_price === undefined) {
                    item.unit_price = typeof item.product.price === 'string'
                        ? parseFloat(item.product.price)
                        : Number(item.product.price || 0);
                }
                return item;
            });
        } catch (_) {
            items.value = [];
        }

        if (mergeAnonymous && anonymousItems.length > 0) {
            let hasChanges = false;
            anonymousItems.forEach(anonItem => {
                const existing = findItem(anonItem.product.id_product, anonItem.id_product_attribute || '0');
                const anonPrice = anonItem.unit_price || (typeof anonItem.product.price === 'string' ? parseFloat(anonItem.product.price) : Number(anonItem.product.price || 0));
                if (existing) {
                    existing.quantity += anonItem.quantity;
                    existing.unit_price = anonPrice;
                    existing.total_price = existing.unit_price * existing.quantity;
                } else {
                    items.value.push({ ...anonItem, unit_price: anonPrice });
                }
                hasChanges = true;
            });
            _saveToStorage();
            if (hasChanges) syncToServer();
            localStorage.removeItem(STORAGE_PREFIX + 'anonymous');
        }
    }

    function clearAnonymousCart() {
        if (currentUserKey.value === 'anonymous') items.value = [];
        localStorage.removeItem(STORAGE_PREFIX + 'anonymous');
        _saveToStorage();
    }

    function mergeServerItems(serverItems: CartItem[]) {
        if (serverItems.length === 0) return;
        serverItems.forEach(serverItem => {
            const existing = findItem(serverItem.product.id_product, serverItem.id_product_attribute || '0');
            if (existing) {
                existing.quantity = serverItem.quantity;
                existing.unit_price = serverItem.unit_price;
                existing.total_price = existing.unit_price * existing.quantity;
            } else {
                items.value.push(serverItem);
            }
        });
        _saveToStorage();
    }

    const totalAmount = computed(() =>
        items.value.reduce((total, item) => total + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0), 0)
    );
    const totalItems = computed(() =>
        items.value.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    );

    const isCartDrawerOpen = ref(false);
    function toggleCartDrawer() { isCartDrawerOpen.value = !isCartDrawerOpen.value; }
    function openCartDrawer()   { isCartDrawerOpen.value = true; }
    function closeCartDrawer()  { isCartDrawerOpen.value = false; }

    async function addProduct(product: Product, quantity = 1, id_product_attribute = '0', unitPrice?: number) {
        const existing = findItem(product.id_product, id_product_attribute);
        const finalPrice = unitPrice !== undefined
            ? unitPrice
            : (typeof product.price === 'string' ? parseFloat(product.price) : product.price as number);

        if (existing) {
            existing.quantity += quantity;
            existing.unit_price = finalPrice;
            existing.total_price = finalPrice * existing.quantity;
        } else {
            items.value.push({ product, quantity, unit_price: finalPrice, total_price: finalPrice * quantity, id_product_attribute });
        }
        _saveToStorage();
        openCartDrawer();
        await syncToServer();
    }

    async function updateQuantity(productId: string | number, quantity: number, id_product_attribute = '0') {
        const existing = findItem(productId, id_product_attribute);
        if (existing) {
            if (quantity <= 0) { await removeProduct(productId, id_product_attribute); return; }
            existing.quantity = quantity;
            existing.total_price = existing.unit_price * existing.quantity;
            _saveToStorage();
            await syncToServer();
        }
    }

    async function removeProduct(productId: string | number, id_product_attribute = '0') {
        items.value = items.value.filter(
            i => !(String(i.product.id_product) === String(productId) &&
                   String(i.id_product_attribute || '0') === String(id_product_attribute || '0'))
        );
        _saveToStorage();
        await syncToServer();
    }

    async function clearCart() {
        items.value = [];
        _saveToStorage();
        await syncToServer();
    }

    function setItemsFromServer(serverItems: CartItem[]) {
        if (serverItems.length > 0 && items.value.length === 0) {
            items.value = serverItems;
            _saveToStorage();
        }
    }

    return {
        items, totalAmount, totalItems, currentUserKey,
        isCartDrawerOpen, toggleCartDrawer, openCartDrawer, closeCartDrawer,
        addProduct, updateQuantity, removeProduct, clearCart,
        loadForUser, clearAnonymousCart, mergeServerItems, setItemsFromServer,
    };
});

export default cartService;
