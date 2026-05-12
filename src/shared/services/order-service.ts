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

    async createOrder(customerId: number, cartId: number, totalAmount: number, addressId: number = 1): Promise<number> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <order>
        <id_address_delivery>${addressId}</id_address_delivery>
        <id_address_invoice>${addressId}</id_address_invoice>
        <id_cart>${cartId}</id_cart>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_customer>${customerId}</id_customer>
        <id_carrier>1</id_carrier>
        <module>cashondelivery</module>
        <payment>Cash on delivery (COD)</payment>
        <total_paid>${totalAmount.toFixed(2)}</total_paid>
        <total_paid_real>${totalAmount.toFixed(2)}</total_paid_real>
        <total_products>${totalAmount.toFixed(2)}</total_products>
        <total_products_wt>${totalAmount.toFixed(2)}</total_products_wt>
        <conversion_rate>1</conversion_rate>
    </order>
</prestashop>`;
        const response: any = await apiService.post('/orders', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return parseInt(response.prestashop.order.id);
    },

    // Déjà présente dans ton order-service.ts
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