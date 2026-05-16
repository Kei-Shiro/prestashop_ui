import apiService from '@shared/api/api-service';

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
     * @returns tableau de {id_product, quantity} ou [] si aucun panier ouvert
     */
    async getOpenCartItemsForCustomer(
        customerId: number
    ): Promise<Array<{ id_product: string; quantity: number }>> {
        try {
            // 1. Trouver les cart IDs déjà convertis en commande pour ce client
            const ordersRes: any = await apiService.get(
                `/orders?filter[id_customer]=${customerId}&display=[id,id_cart]`
            );
            const ordersRaw = ordersRes?.prestashop?.orders?.order || [];
            const ordersArr = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];
            const usedCartIds = new Set(
                ordersArr.map((o: any) => String(o.id_cart)).filter(Boolean)
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
                if (usedCartIds.has(String(cart.id))) continue;

                const rowsRaw = cart.associations?.cart_rows?.cart_row;
                if (!rowsRaw) continue;
                const rowsArr = Array.isArray(rowsRaw) ? rowsRaw : [rowsRaw];


                rowsArr.forEach((r: any) => {
                    if (r.id_product && String(r.id_product) !== '0' && Number(r.quantity) > 0) {
                        const id = String(r.id_product);
                        const qty = Number(r.quantity);
                        aggregatedItems.set(id, (aggregatedItems.get(id) || 0) + qty);
                    }
                });
            }

            if (aggregatedItems.size > 0) {
                console.log(`[orderService] ${aggregatedItems.size} produits agrégés depuis les paniers PS ouverts pour client ${customerId}`);
                return Array.from(aggregatedItems.entries()).map(([id_product, quantity]) => ({
                    id_product,
                    quantity
                }));
            }
        } catch (e) {
            console.warn('[orderService] getOpenCartItemsForCustomer failed:', e);
        }
        return [];
    },

    /**
     * Trouve l'ID du premier transporteur actif dans PS.
     * Nécessaire car le carrier ID 1 peut ne pas exister selon la config.
     */
    async detectCarrierId(): Promise<number> {
        try {
            const response: any = await apiService.get(
                '/carriers?display=full&filter[deleted]=0'
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

    async createCart(customerId: number, items: any[], addressId: number = 1): Promise<number> {
        let cartRows = items.map(item => `
        <cart_row>
            <id_product>${item.product.id_product}</id_product>
            <id_product_attribute>0</id_product_attribute>
            <id_address_delivery>${addressId}</id_address_delivery>
            <id_customization>0</id_customization>
            <quantity>${item.quantity}</quantity>
        </cart_row>`).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <cart>
        <id_customer>${customerId}</id_customer>
        <id_address_delivery>${addressId}</id_address_delivery>
        <id_address_invoice>${addressId}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <associations>
            <cart_rows>
                ${cartRows}
            </cart_rows>
        </associations>
    </cart>
</prestashop>`;
        const response: any = await apiService.post('/carts', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return parseInt(response.prestashop.cart.id);
    },

    async createOrder(
        customerId: number,
        cartId: number,
        totalAmount: number,
        addressId: number = 1,
        initialStateId: number = 3,
        carrierId: number = 1,
        moduleName: string = 'cashondelivery'
    ): Promise<number> {
        const total = totalAmount.toFixed(2);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <order>
        <id_address_delivery>${addressId}</id_address_delivery>
        <id_address_invoice>${addressId}</id_address_invoice>
        <id_cart>${cartId}</id_cart>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_carrier>${carrierId}</id_carrier>
        <current_state>${initialStateId}</current_state>
        <module>${moduleName}</module>
        <payment>Paiement à la livraison</payment>
        <total_discounts>0.000000</total_discounts>
        <total_discounts_tax_incl>0.000000</total_discounts_tax_incl>
        <total_discounts_tax_excl>0.000000</total_discounts_tax_excl>
        <total_paid>${total}</total_paid>
        <total_paid_tax_incl>${total}</total_paid_tax_incl>
        <total_paid_tax_excl>${total}</total_paid_tax_excl>
        <total_paid_real>0.000000</total_paid_real>
        <total_products>${total}</total_products>
        <total_products_wt>${total}</total_products_wt>
        <total_shipping>0.000000</total_shipping>
        <total_shipping_tax_incl>0.000000</total_shipping_tax_incl>
        <total_shipping_tax_excl>0.000000</total_shipping_tax_excl>
        <total_wrapping>0.000000</total_wrapping>
        <total_wrapping_tax_incl>0.000000</total_wrapping_tax_incl>
        <total_wrapping_tax_excl>0.000000</total_wrapping_tax_excl>
        <conversion_rate>1</conversion_rate>
    </order>
</prestashop>`;
        const response: any = await apiService.post('/orders', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        // PrestaShop renvoie HTTP 200 avec corps PHP d'erreur si la création échoue
        if (!response?.prestashop?.order?.id) {
            throw new Error(
                `La création de commande a échoué (module: ${moduleName}, carrier: ${carrierId}, state: ${initialStateId}). ` +
                `Vérifiez dans PS admin : module COD actif, transporteur existant, et état de commande valide.`
            );
        }
        return parseInt(response.prestashop.order.id);
    },

    async updateOrderStatus(orderId: number, newStateId: number): Promise<void> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <order_history>
        <id_order>${orderId}</id_order>
        <id_order_state>${newStateId}</id_order_state>
    </order_history>
</prestashop>`;
        await apiService.post('/order_histories', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
    }

};