import apiService from './api-service';

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

    async createCart(customerId: number, items: { productId: number; quantity: number }[]): Promise<number> {
        let cartRows = '';
        items.forEach(item => {
            cartRows += `
                <cart_row>
                    <id_product>${item.productId}</id_product>
                    <id_product_attribute>0</id_product_attribute>
                    <id_address_delivery>1</id_address_delivery>
                    <quantity>${item.quantity}</quantity>
                </cart_row>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <cart>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_address_delivery>1</id_address_delivery>
        <id_address_invoice>1</id_address_invoice>
        <associations>
            <cart_rows>${cartRows}</cart_rows>
        </associations>
    </cart>
</prestashop>`;

        const response: any = await apiService.post('/carts', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return response.prestashop.cart.id;
    },

    async createOrder(customerId: number, cartId: number, totalAmount: number): Promise<void> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
    <order>
        <id_address_delivery>1</id_address_delivery>
        <id_address_invoice>1</id_address_invoice>
        <id_cart>${cartId}</id_cart>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_carrier>1</id_carrier>
        <module>cashondelivery</module>
        <payment>Paiement à la livraison</payment>
        <total_paid>${totalAmount}</total_paid>
        <total_paid_real>${totalAmount}</total_paid_real>
        <total_products>${totalAmount}</total_products>
        <total_products_wt>${totalAmount}</total_products_wt>
        <conversion_rate>1</conversion_rate>
        <current_state>3</current_state>
    </order>
</prestashop>`;
        
        await apiService.post('/orders', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
    },

    async getCustomerOrders(customerId: number): Promise<any[]> {
        const response: any = await apiService.get(`/orders?display=full&filter[id_customer]=${customerId}`);
        const orders = response.prestashop?.orders?.order;
        if (!orders) return [];
        return Array.isArray(orders) ? orders : [orders];
    },

    async updateOrderStatus(orderId: number, newStateId: number): Promise<void> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
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