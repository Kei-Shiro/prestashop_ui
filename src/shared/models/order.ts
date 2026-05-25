import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { withLoading } from '@shared/utils/asyncUtils';
import { formatForDisplay } from '@shared/utils/dateUtils';
import { DomainPriceService } from '@shared/utils/priceUtils';
import { DomainCartHelper } from '@shared/utils/cartUtils';
import { DomainOrderHelper } from '@shared/utils/orderUtils';
import { cartService, useCartStore } from './cart';
import { productService } from './product';
import type { Order, OrderRow, OrderCreatePayload } from '@shared/types/order';
import type { OrderState } from '@shared/types/order-state';
import type { OrderHistoryCreatePayload } from '@shared/types/order-history';

// Re-export canonical types for consumers
export type { Order, OrderRow } from '@shared/types/order';
export type { OrderState } from '@shared/types/order-state';

/**
 * UI-level mapped order — normalized and enriched for display in the back-office.
 */
export interface MappedOrder {
    id: number;
    reference: string;
    customerId?: number;
    customerName: string;
    totalPaid: string;
    payment: string;
    dateAdd: string;
    currentState: {
        id: number;
        label: string;
        color: string;
    };
}

export interface CheckoutForm {
    email: string;
    firstname: string;
    lastname: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
}

export const orderService = {
    async getOrders(): Promise<Order[]> {
        const response = await apiService.get<any>('/orders?display=full');
        return ensureArray(response.prestashop?.orders?.order);
    },

    async getOrderStates(): Promise<OrderState[]> {
        const response = await apiService.get<any>('/order_states?display=full');
        return ensureArray(response.prestashop?.order_states?.order_state);
    },

    async getCarriers(): Promise<any[]> {
        const response = await apiService.get<any>('/carriers?display=full');
        return ensureArray(response.prestashop?.carriers?.carrier);
    },

    detectCodModuleName(): string {
        return 'ps_cashondelivery';
    },

    async createOrder(
        customerId: number,
        cartId: number,
        items: Array<{ id_product: string | number; id_product_attribute: string | number; quantity: number }>,
        totalAmount: number,
        addressId = 1,
        initialStateId = 11,
        carrierId = 1,
        moduleName = 'ps_cashondelivery',
        paymentLabel = 'Paiement à la livraison',
        secureKey?: string
    ): Promise<number> {
        const total = parseFloat(totalAmount.toFixed(6));

        const payload: { order: OrderCreatePayload } = {
            order: {
                id_shop: 1,
                id_shop_group: 1,
                id_address_delivery: addressId,
                id_address_invoice: addressId,
                id_cart: cartId,
                id_currency: 1,
                id_lang: 1,
                id_customer: customerId,
                id_carrier: carrierId,
                current_state: initialStateId,
                module: moduleName,
                payment: paymentLabel,
                total_discounts: 0,
                total_discounts_tax_incl: 0,
                total_discounts_tax_excl: 0,
                total_paid: total,
                total_paid_tax_incl: total,
                total_paid_tax_excl: total,
                total_paid_real: total,
                total_products: total,
                total_products_wt: total,
                total_shipping: 0,
                total_shipping_tax_incl: 0,
                total_shipping_tax_excl: 0,
                total_wrapping: 0,
                total_wrapping_tax_incl: 0,
                total_wrapping_tax_excl: 0,
                conversion_rate: 1,
                valid: 1,
                secure_key: secureKey,
                associations: {
                    order_rows: {
                        order_row: items.map(item => ({
                            product_id: item.id_product,
                            product_attribute_id: item.id_product_attribute || 0,
                            product_quantity: item.quantity
                        }))
                    }
                }
            }
        };

        const response = await apiService.post<any>('/orders', payload);
        if (!response?.prestashop?.order?.id) {
            throw new Error(
                `La création de commande a échoué (module: ${moduleName}, carrier: ${carrierId}, state: ${initialStateId}). ` +
                `Vérifiez dans PS admin : module COD actif, transporteur existant, et état de commande valide.`
            );
        }

        return parseInt(extractIdValue(response.prestashop.order.id));
    },

    async updateOrderStatus(orderId: number, newStateId: number): Promise<void> {
        if (DomainOrderHelper.triggersStockMovement(newStateId)) {
            await apiService.putstate('/stockmvtapi/orderstate', {
                order_states: {
                    order_state: { id_order: orderId, id_order_state: newStateId }
                }
            });
        }

        const historyPayload: OrderHistoryCreatePayload = {
            id_order: orderId,
            id_order_state: newStateId
        };
        await apiService.post('/order_histories', { order_history: historyPayload });
    },

    async checkReorderStock(
        orderId: number,
        multiplier: number
    ): Promise<{
        success: boolean;
        available: boolean;
        error?: string;
        order?: Order;
        itemsToOrder?: Array<{
            id_product: string;
            id_product_attribute: string;
            quantity: number;
            unit_price: number;
            name: string;
            id_default_image?: string;
            current_stock: number;
            available: boolean;
        }>;
    }> {
        try {
            const orderRes = await apiService.get<any>(`/orders/${orderId}`);
            const order: Order = orderRes?.prestashop?.order;
            if (!order) return { success: false, available: false, error: `Commande #${orderId} introuvable.` };

            const rows = ensureArray(order.associations?.order_rows?.order_row) as OrderRow[];
            if (rows.length === 0) return { success: false, available: false, error: "La commande d'origine ne contient aucun article." };

            // Group duplicates in-memory using DomainCartHelper
            const rawItems = rows.map(r => ({
                id_product: extractIdValue(r.product_id),
                id_product_attribute: extractIdValue(r.product_attribute_id) || '0',
                quantity: Number(extractIdValue(r.product_quantity)) * multiplier,
                originalName: r.product_name
            }));
            const groupedRows = DomainCartHelper.consolidateItems(rawItems);

            let overallAvailable = true;
            const enrichedItems: Array<{
                id_product: string;
                id_product_attribute: string;
                quantity: number;
                unit_price: number;
                name: string;
                id_default_image?: string;
                current_stock: number;
                available: boolean;
            }> = [];

            // A single async loop to load details, check stock, and calculate TTC prices
            for (const item of groupedRows) {
                const p = await productService.getProduct(Number(item.id_product));
                const stockCheck = await productService.checkStock(item.id_product, item.id_product_attribute, item.quantity);

                if (!stockCheck.available) {
                    overallAvailable = false;
                }

                // Price TTC calculation (including combination impact if any)
                let unitPriceTTC = parseFloat(p.price);
                if (item.id_product_attribute !== '0') {
                    const combinations = await productService.getCombinations(Number(item.id_product));
                    const combo = combinations.find(c => String(c.id) === item.id_product_attribute);
                    unitPriceTTC = DomainPriceService.calculateFinalPrice(p.price, p.tax_rate || 0, combo?.price);
                }

                enrichedItems.push({
                    id_product: item.id_product,
                    id_product_attribute: item.id_product_attribute,
                    quantity: item.quantity,
                    unit_price: unitPriceTTC,
                    name: item.originalName || p.name,
                    id_default_image: p.id_default_image,
                    current_stock: stockCheck.currentStock,
                    available: stockCheck.available
                });
            }

            return { success: true, available: overallAvailable, order, itemsToOrder: enrichedItems };
        } catch (e: any) {
            console.error('[orderService.checkReorderStock] Error:', e);
            return { success: false, available: false, error: e.message || 'Erreur lors de la vérification du stock.' };
        }
    },

    async reorder(
        orderId: number,
        multiplier: number
    ): Promise<{ success: boolean; orderId?: number; error?: string }> {
        try {
            const stockCheck = await this.checkReorderStock(orderId, multiplier);
            if (!stockCheck.success || !stockCheck.available) {
                return { success: false, error: stockCheck.error || "Stock insuffisant pour passer la commande." };
            }

            const order = stockCheck.order!;
            const itemsToOrder = stockCheck.itemsToOrder!;

            const customerId = Number(extractIdValue(order.id_customer));
            const addressId = Number(extractIdValue(order.id_address_delivery)) || 1;
            const carrierId = Number(extractIdValue(order.id_carrier)) || await cartService.detectCarrierId();
            const cartId = await cartService.createCart(customerId, itemsToOrder, addressId);
            const totalAmount = itemsToOrder.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

            const newOrderId = await this.createOrder(
                customerId, cartId, itemsToOrder, totalAmount, addressId,
                11, carrierId,
                order.module || 'ps_cashondelivery',
                order.payment || 'Paiement à la livraison',
                order.secure_key
            );

            return { success: true, orderId: newOrderId };
        } catch (e: any) {
            console.error('[orderService.reorder] Error:', e);
            return { success: false, error: e.message || 'Erreur inconnue lors du processus de recommandation.' };
        }
    }
};

interface DailyStat {
    date: string;
    count: number;
    amount: number;
    amountTTC: number;
}

export const useOrderStore = defineStore('order', () => {
    const orders = ref<Order[]>([]);
    const activeCartsCount = ref(0);
    const loading = ref(false);
    const periodFilter = ref<'all' | 'month' | 'week' | 'today'>('all');

    const filteredOrders = computed(() => {
        const activeOrders = orders.value.filter(order => extractIdValue(order.current_state) !== '6');
        if (periodFilter.value === 'all') return activeOrders;
        const now = new Date();
        const threshold = new Date();
        if (periodFilter.value === 'today') threshold.setHours(0, 0, 0, 0);
        else if (periodFilter.value === 'week') threshold.setDate(now.getDate() - 7);
        else if (periodFilter.value === 'month') threshold.setMonth(now.getMonth() - 1);
        return activeOrders.filter(order => {
            const dateRaw = order.date_add;
            if (!dateRaw) return false;
            return new Date(dateRaw) >= threshold;
        });
    });

    const fetchOrders = async () => {
        await withLoading(loading, async () => {
            const [orderRes, cartRes, allOrderCartsRes] = await Promise.all([
                apiService.get<any>('/orders?display=full'),
                apiService.get<any>('/carts?display=[id]&filter[id_customer]=![0]'),
                apiService.get<any>('/orders?display=[id_cart]')
            ]);

            orders.value = ensureArray(orderRes?.prestashop?.orders?.order);
            const cartsList = ensureArray(cartRes?.prestashop?.carts?.cart);
            const allOrdersList = ensureArray(allOrderCartsRes?.prestashop?.orders?.order);
            const usedCartIds = new Set(allOrdersList.map((o: any) => extractIdValue(o.id_cart)));

            activeCartsCount.value = cartsList.filter((c: any) => {
                const cid = extractIdValue(c.id);
                return !usedCartIds.has(cid);
            }).length;
        });
    };

    const totalOrders = computed(() => filteredOrders.value.length);
    const totalAmount = computed(() =>
        filteredOrders.value.reduce((sum, order) => sum + (Number(order.total_paid_tax_excl || order.total_paid) || 0), 0)
    );
    const totalAmountTTC = computed(() =>
        filteredOrders.value.reduce((sum, order) => sum + (Number(order.total_paid) || 0), 0)
    );

    const dailyStats = computed<DailyStat[]>(() => {
        const statsMap = new Map<string, DailyStat>();
        filteredOrders.value.forEach(order => {
            const dateKey = order.date_add ? String(order.date_add).split(' ')[0] : 'Inconnu';
            if (!statsMap.has(dateKey)) {
                statsMap.set(dateKey, { date: dateKey, count: 0, amount: 0, amountTTC: 0 });
            }
            const stat = statsMap.get(dateKey)!;
            stat.count += 1;
            stat.amount += Number(order.total_paid_tax_excl || order.total_paid) || 0;
            stat.amountTTC += Number(order.total_paid) || 0;
        });
        return Array.from(statsMap.values()).sort((a, b) => b.date.localeCompare(a.date));
    });

    return { orders, activeCartsCount, loading, periodFilter, filteredOrders, fetchOrders, totalOrders, totalAmount, totalAmountTTC, dailyStats };
});

export default orderService;
