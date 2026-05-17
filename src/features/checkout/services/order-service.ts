import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { StockMovement } from "@shared/types/import";

async function getUsedCartIds(customerId: number): Promise<Set<string>> {
    const res: any = await apiService.get(`/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`);
    const orders = res?.prestashop?.orders?.order || [];
    const arr = Array.isArray(orders) ? orders : [orders];
    return new Set(arr.map((o: any) => extractIdValue(o.id_cart)).filter(Boolean));
}

export const orderService = {
    async getOrders(): Promise<any[]> {
        const response: any = await apiService.get('/orders?display=full');
        return response.prestashop?.orders?.order || [];
    },

    async getOrderStates(): Promise<any[]> {
        const response: any = await apiService.get('/order_states?display=full');
        return response.prestashop?.order_states?.order_state || [];
    },

    async getCustomers(): Promise<any[]> {
        const response: any = await apiService.get('/customers?display=full');
        return response.prestashop?.customers?.customer || [];
    },

    async getCarriers(): Promise<any[]> {
        const response: any = await apiService.get('/carriers?display=full');
        return response.prestashop?.carriers?.carrier || [];
    },

    async getOpenCartItemsForCustomer(
        customerId: number
    ): Promise<Array<{ id_product: string; id_product_attribute: string; quantity: number }>> {
        try {
            const usedCartIds = await getUsedCartIds(customerId);

            const cartsRes: any = await apiService.get(`/carts?filter[id_customer]=${customerId}&display=full`);
            const cartsRaw = cartsRes?.prestashop?.carts?.cart;
            if (!cartsRaw) return [];
            const cartsArr = Array.isArray(cartsRaw) ? cartsRaw : [cartsRaw];

            const aggregatedItems = new Map<string, number>();

            for (const cart of cartsArr) {
                if (usedCartIds.has(extractIdValue(cart.id))) continue;

                const rowsRaw = cart.associations?.cart_rows?.cart_row;
                if (!rowsRaw) continue;
                const rowsArr = Array.isArray(rowsRaw) ? rowsRaw : [rowsRaw];

                rowsArr.forEach((r: any) => {
                    const id = extractIdValue(r.id_product);
                    const id_attr = extractIdValue(r.id_product_attribute) || '0';
                    const qty = Number(typeof r.quantity === 'object' ? r.quantity['#text'] : r.quantity);
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
            console.warn('[orderService] getOpenCartItemsForCustomer failed:', e);
        }
        return [];
    },

    async getLatestOpenCartId(customerId: number): Promise<number | null> {
        try {
            const usedCartIds = await getUsedCartIds(customerId);

            const cartsRes: any = await apiService.get(`/carts?filter[id_customer]=${customerId}&sort=[id_DESC]&display=[id]`);
            const cartsRaw = cartsRes?.prestashop?.carts?.cart;
            if (!cartsRaw) return null;
            const cartsArr = Array.isArray(cartsRaw) ? cartsRaw : [cartsRaw];

            for (const cart of cartsArr) {
                const id = extractIdValue(cart.id);
                if (id && !usedCartIds.has(id)) return Number(id);
            }
        } catch (e) {
            console.warn('[orderService] getLatestOpenCartId failed:', e);
        }
        return null;
    },

    async detectCarrierId(): Promise<number> {
        try {
            const response: any = await apiService.get('/carriers?display=full&filter[active]=1&filter[deleted]=0');
            const carriers = response?.prestashop?.carriers?.carrier;
            if (!carriers) return 1;
            const arr = Array.isArray(carriers) ? carriers : [carriers];
            const active = arr.find((c: any) => String(c.active) === '1' && String(c.deleted) !== '1');
            if (active) return Number(active.id);
        } catch (e) {
            console.warn('[orderService] detectCarrierId failed, using 1', e);
        }
        return 1;
    },

    detectCodModuleName(): string {
        return 'ps_cashondelivery';
    },

    async createCart(customerId: number, items: any[], addressId: number = 0): Promise<number> {
        const carrierId = await this.detectCarrierId();
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const payload: any = {
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
                date_upd: now
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

        const response: any = await apiService.post('/carts', payload);
        return parseInt(extractIdValue(response.prestashop.cart.id));
    },

    async updateCart(cartId: number, customerId: number, items: any[], addressId: number = 0): Promise<number> {
        const carrierId = await this.detectCarrierId();
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        const payload: any = {
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
                associations: {
                    cart_rows: {}
                }
            }
        };

        if (items.length > 0) {
            payload.cart.associations.cart_rows.cart_row = items.map(item => ({
                id_product: item.id_product,
                id_product_attribute: item.id_product_attribute || 0,
                id_address_delivery: addressId,
                id_customization: 0,
                quantity: item.quantity
            }));
        } else {
            payload.cart.associations.cart_rows = '';
        }

        await apiService.put(`/carts/${cartId}`, payload);
        return cartId;
    },

    async createOrder(
        customerId: number,
        cartId: number,
        items: any[],
        totalAmount: number,
        addressId: number = 1,
        initialStateId: number = 2,
        carrierId: number = 1,
        moduleName: string = 'ps_cashondelivery'
    ): Promise<number> {
        const total = parseFloat(totalAmount.toFixed(6));

        const payload: any = {
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
                payment: 'Paiement à la livraison',
                total_discounts: 0.000000,
                total_discounts_tax_incl: 0.000000,
                total_discounts_tax_excl: 0.000000,
                total_paid: total,
                total_paid_tax_incl: total,
                total_paid_tax_excl: total,
                total_paid_real: total,
                total_products: total,
                total_products_wt: total,
                total_shipping: 0.000000,
                total_shipping_tax_incl: 0.000000,
                total_shipping_tax_excl: 0.000000,
                total_wrapping: 0.000000,
                total_wrapping_tax_incl: 0.000000,
                total_wrapping_tax_excl: 0.000000,
                conversion_rate: 1.000000,
                valid: 1,
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

        const response: any = await apiService.post('/orders', payload);
        if (!response?.prestashop?.order?.id) {
            throw new Error(
                `La création de commande a échoué (module: ${moduleName}, carrier: ${carrierId}, state: ${initialStateId}). ` +
                `Vérifiez dans PS admin : module COD actif, transporteur existant, et état de commande valide.`
            );
        }

        for (const item of items) {
            const stockMvt: StockMovement = {
                id_product: item.id_product,
                id_product_attribute: item.id_product_attribute || 0,
                physical_quantity: item.quantity,
                sign: -1,
                id_stock_mvt_reason: 3,
                date_add: new Date().toISOString().slice(0, 19).replace('T', ' '),
            };
            await apiService.postStockMvt('/stockmvtapi/stockmvt', { stock_mvt: stockMvt });
        }

        return parseInt(extractIdValue(response.prestashop.order.id));
    },

    async updateOrderStatus(orderId: number, newStateId: number): Promise<void> {
        await apiService.post('/order_histories', {
            order_history: {
                id_order: orderId,
                id_order_state: newStateId
            }
        });
    }
};
