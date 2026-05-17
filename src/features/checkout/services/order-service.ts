import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';

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

    /**
     * Retourne les articles de TOUS les paniers ouverts (non commandés) d'un client.
     * Les quantités sont agrégées par produit.
     * @returns tableau de {id_product, id_product_attribute, quantity} ou [] si aucun panier ouvert
     */
    async getOpenCartItemsForCustomer(
        customerId: number
    ): Promise<Array<{ id_product: string; id_product_attribute: string; quantity: number }>> {
        try {
            // 1. Trouver les cart IDs déjà convertis en commande pour ce client
            const ordersRes: any = await apiService.get(
                `/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`
            );
            const ordersRaw = ordersRes?.prestashop?.orders?.order || [];
            const ordersArr = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];
            const usedCartIds = new Set(
                ordersArr.map((o: any) => extractIdValue(o.id_cart)).filter(Boolean)
            );

            // 2. Récupérer tous les paniers du client
            const cartsRes: any = await apiService.get(
                `/carts?filter[id_customer]=${customerId}&display=full`
            );
            const cartsRaw = cartsRes?.prestashop?.carts?.cart;
            if (!cartsRaw) return [];
            const cartsArr = Array.isArray(cartsRaw) ? cartsRaw : [cartsRaw];

            // 3. Agréger les produits de tous les paniers non utilisés
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
                console.log(`[orderService] ${aggregatedItems.size} produits agrégés depuis les paniers PS ouverts pour client ${customerId}`);
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

    /**
     * Trouve l'ID du panier ouvert le plus récent pour un client.
     */
    async getLatestOpenCartId(customerId: number): Promise<number | null> {
        try {
            // 1. Trouver les cart IDs déjà convertis en commande pour ce client
            const ordersRes: any = await apiService.get(
                `/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`
            );
            const ordersRaw = ordersRes?.prestashop?.orders?.order || [];
            const ordersArr = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];
            const usedCartIds = new Set(
                ordersArr.map((o: any) => extractIdValue(o.id_cart)).filter(Boolean)
            );

            // 2. Récupérer les paniers du client, triés du plus récent au plus ancien
            const cartsRes: any = await apiService.get(
                `/carts?filter[id_customer]=${customerId}&sort=[id_DESC]&display=[id]`
            );
            const cartsRaw = cartsRes?.prestashop?.carts?.cart;
            if (!cartsRaw) return null;
            const cartsArr = Array.isArray(cartsRaw) ? cartsRaw : [cartsRaw];

            for (const cart of cartsArr) {
                const id = extractIdValue(cart.id);
                if (id && !usedCartIds.has(id)) {
                    return Number(id);
                }
            }
        } catch (e) {
            console.warn('[orderService] getLatestOpenCartId failed:', e);
        }
        return null;
    },

    /**
     * Trouve l'ID du premier transporteur actif dans PS.
     * Nécessaire car le carrier ID 1 peut ne pas exister selon la config.
     */
    async detectCarrierId(): Promise<number> {
        try {
            const response: any = await apiService.get(
                '/carriers?display=full&filter[active]=1&filter[deleted]=0'
            );
            const carriers = response?.prestashop?.carriers?.carrier;
            if (!carriers) return 1;
            const arr = Array.isArray(carriers) ? carriers : [carriers];
            const active = arr.find(
                (c: any) => String(c.active) === '1' && String(c.deleted) !== '1'
            );
            if (active) {
                console.log(`[orderService] Carrier actif trouvé : ID ${active.id} (${active.name})`);
                return Number(active.id);
            }
        } catch (e) {
            console.warn('[orderService] detectCarrierId failed, using 1', e);
        }
        return 1;
    },

    /**
     * Détecte le nom du module COD actif : 'ps_cashondelivery' ou 'cashondelivery'.
     * PS 1.7.7+ / 8.x → 'ps_cashondelivery'
     * PS 1.7.0–1.7.6 → 'cashondelivery'
     */
    async detectCodModuleName(): Promise<string> {
        const candidates = ['ps_cashondelivery', 'cashondelivery'];
        for (const name of candidates) {
            try {
                // On utilise une recherche simplifiée sans le paramètre display qui peut poser souci sur certains serveurs
                const response: any = await apiService.get(
                    `/modules?filter[name]=${name}`
                );
                
                const modulesRaw = response?.prestashop?.modules?.module;
                if (!modulesRaw) continue;
                
                // Si on a un résultat, on vérifie l'ID pour confirmer qu'il existe
                const arr = Array.isArray(modulesRaw) ? modulesRaw : [modulesRaw];
                if (arr.length > 0 && arr[0].id) {
                    console.log(`[orderService] Module COD détecté : ${name}`);
                    return name;
                }
            } catch (_) { /* continue */ }
        }
        console.warn('[orderService] Aucun module COD détecté via API, fallback ps_cashondelivery');
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
            // Un tableau vide est ignoré par le parser XML pour des tags simples (il n'écrit rien).
            // Pour forcer un tag vide <cart_rows></cart_rows>, on peut passer une chaîne vide ou ne pas passer l'attribut cart_row.
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
        // PrestaShop renvoie HTTP 200 avec corps PHP d'erreur si la création échoue
        if (!response?.prestashop?.order?.id) {
            throw new Error(
                `La création de commande a échoué (module: ${moduleName}, carrier: ${carrierId}, state: ${initialStateId}). ` +
                `Vérifiez dans PS admin : module COD actif, transporteur existant, et état de commande valide.`
            );
        }
        return parseInt(extractIdValue(response.prestashop.order.id));
    },

    async updateOrderStatus(orderId: number, newStateId: number): Promise<void> {
        const payload = {
            order_history: {
                id_order: orderId,
                id_order_state: newStateId
            }
        };
        await apiService.post('/order_histories', payload);
    }

};