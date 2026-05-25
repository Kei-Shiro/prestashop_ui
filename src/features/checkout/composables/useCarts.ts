import { ref } from "vue";
import { orderService } from '@shared/models/order';
import { productService } from '@shared/models/product';
import { customerService } from '@shared/models/customer';
import { cartService } from '@shared/models/cart';
import { ensureArray } from '@shared/utils/arrayUtils';
import { extractIdValue, extractIdNumber } from '@shared/utils/extractIdValue';
import { formatDateTimeForDisplay } from '@shared/utils/dateUtils';
import { DomainPriceService } from '@shared/utils/priceUtils';

export interface MappedCart {
    id: number;
    customerId: number;
    customerName: string;
    dateAdd: string;
    dateUpd: string;
    itemsCount: number;
    rawCart: any;
}

export function useCarts() {
    const carts = ref<MappedCart[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const convertingCartId = ref<number | null>(null);

    const loadCarts = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const [rawOrders, rawCarts] = await Promise.all([
                orderService.getOrders(),
                cartService.getCarts()
            ]);

            const ordersArray = ensureArray(rawOrders);
            const cartsArray = ensureArray(rawCarts);

            const usedCartIds = new Set(ordersArray.map(o => extractIdNumber(o.id_cart)).filter(id => id > 0));
            const activeCarts = cartsArray.filter(cart => !usedCartIds.has(extractIdNumber(cart.id)));

            const customerIds = [...new Set(activeCarts.map(cart => extractIdNumber(cart.id_customer)).filter(id => id > 0))];
            const rawCustomers = await customerService.getCustomersByIds(customerIds);
            const customersArray = ensureArray(rawCustomers);

            const customersMap = new Map();
            customersArray.forEach(customer => {
                customersMap.set(Number(customer.id), `${customer.firstname} ${customer.lastname}`);
            });

            carts.value = activeCarts
                .map(cart => {
                    const customerId = extractIdNumber(cart.id_customer);
                    
                    const rowsRaw = cart.associations?.cart_rows?.cart_row;
                    const rowsArr = ensureArray(rowsRaw);
                    const itemsCount = rowsArr.length;

                    return {
                        id: Number(cart.id),
                        customerId: customerId,
                        customerName: customersMap.get(customerId) || "Invité",
                        dateAdd: formatDateTimeForDisplay(cart.date_add),
                        dateUpd: formatDateTimeForDisplay(cart.date_upd),
                        itemsCount: itemsCount,
                        rawCart: cart
                    };
                })
                .sort((a, b) => b.id - a.id);

        } catch (err) {
            console.error(err);
            error.value = "Erreur lors du chargement des paniers.";
        } finally {
            isLoading.value = false;
        }
    };

    const validateCartAsOrder = async (cartId: number) => {
        const cart = carts.value.find(c => c.id === cartId);
        if (!cart) return;

        convertingCartId.value = cartId;
        try {
            const rowsRaw = cart.rawCart.associations?.cart_rows?.cart_row;
            if (!rowsRaw) throw new Error("Le panier est vide");
            
            const rowsArr = ensureArray(rowsRaw);
            
            // Fetch only specific products present in this cart to get correct prices
            const productIds = [...new Set(rowsArr.map((row: any) => extractIdNumber(row.id_product)).filter(id => id > 0))];
            const productsList = await Promise.all(productIds.map(id => productService.getProduct(id)));
            const productMap = new Map(productsList.map(p => [p.id_product, p]));

            let totalAmount = 0;
            const items = await Promise.all(rowsArr.map(async (row: any) => {
                const idProd = String(extractIdNumber(row.id_product));
                const idAttr = String(extractIdNumber(row.id_product_attribute) || 0);
                const qty = extractIdNumber(row.quantity);
                const product = productMap.get(idProd);
                
                if (product) {
                    let price = parseFloat(product.price);
                    if (idAttr !== '0') {
                        try {
                            const combinations = await productService.getCombinations(Number(idProd));
                            const combination = combinations.find(c => extractIdValue(c.id) === idAttr);
                            price = DomainPriceService.calculateFinalPrice(product.price, product.tax_rate || 0, combination?.price);
                        } catch (e) {
                            console.warn(`Could not get combination ${idAttr} for product ${idProd}`, e);
                        }
                    }
                    totalAmount += price * qty;
                }

                return {
                    id_product: idProd,
                    id_product_attribute: idAttr,
                    quantity: qty
                };
            }));

            const customerId = extractIdNumber(cart.rawCart.id_customer);
            const addressId = extractIdNumber(cart.rawCart.id_address_delivery) || 1;
            const carrierId = extractIdNumber(cart.rawCart.id_carrier) || 1;

            const orderId = await orderService.createOrder(
                customerId,
                cartId,
                items,
                totalAmount,
                addressId,
                11, // Paiement à distance accepté
                carrierId,
                'ps_cashondelivery',
                'Paiement à distance'
            );

            await orderService.updateOrderStatus(orderId, 11);

            // Remove from list after successful conversion
            carts.value = carts.value.filter(c => c.id !== cartId);
        } catch (err) {
            console.error("Conversion failed:", err);
            alert("Erreur lors de la conversion du panier en commande.");
        } finally {
            convertingCartId.value = null;
        }
    };

    return {
        carts,
        isLoading,
        error,
        convertingCartId,
        loadCarts,
        validateCartAsOrder
    };
}
