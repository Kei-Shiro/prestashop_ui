import { ref } from "vue";
import { orderService } from '@shared/models/order';
import { productService } from '@shared/models/product';
import { customerService } from '@shared/models/customer';
import { cartService } from '@shared/models/cart';
import { ensureArray } from '@shared/utils/arrayUtils';

export interface MappedCart {
    id: number;
    customerId: number;
    customerName: string;
    dateAdd: string;
    dateUpd: string;
    itemsCount: number;
    rawCart: any;
}

import { extractIdValue } from '@shared/utils/extractIdValue';

const psNum = (v: any): number => Number(extractIdValue(v));

export function useCarts() {
    const carts = ref<MappedCart[]>([]);
    const isLoading = ref<boolean>(false);
    const error = ref<string | null>(null);
    const convertingCartId = ref<number | null>(null);

    const loadCarts = async () => {
        isLoading.value = true;
        error.value = null;

        try {
            const [rawOrders, rawCustomers, rawCarts] = await Promise.all([
                orderService.getOrders(),
                customerService.getAllCustomers(),
                cartService.getCarts()
            ]);

            const ordersArray = ensureArray(rawOrders);
            const customersArray = ensureArray(rawCustomers);
            const cartsArray = ensureArray(rawCarts);

            const usedCartIds = new Set(ordersArray.map(o => psNum(o.id_cart)).filter(id => id > 0));

            const customersMap = new Map();
            customersArray.forEach(customer => {
                customersMap.set(Number(customer.id), `${customer.firstname} ${customer.lastname}`);
            });

            carts.value = cartsArray
                .filter(cart => !usedCartIds.has(Number(cart.id)))
                .map(cart => {
                    const customerId = psNum(cart.id_customer);
                    
                    const rowsRaw = cart.associations?.cart_rows?.cart_row;
                    const rowsArr = ensureArray(rowsRaw);
                    const itemsCount = rowsArr.length;

                    return {
                        id: Number(cart.id),
                        customerId: customerId,
                        customerName: customersMap.get(customerId) || "Invité",
                        dateAdd: cart.date_add ? new Date(cart.date_add).toLocaleString('fr-FR') : "",
                        dateUpd: cart.date_upd ? new Date(cart.date_upd).toLocaleString('fr-FR') : "",
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
            
            // Fetch all products to get correct prices
            const allProducts = await productService.getAll();
            const productMap = new Map(allProducts.map(p => [p.id_product, p]));

            let totalAmount = 0;
            const items = rowsArr.map((row: any) => {
                const idProd = String(psNum(row.id_product));
                const idAttr = String(psNum(row.id_product_attribute) || 0);
                const qty = psNum(row.quantity);
                const product = productMap.get(idProd);
                
                if (product) {
                    totalAmount += parseFloat(product.price) * qty;
                }

                return {
                    id_product: idProd,
                    id_product_attribute: idAttr,
                    quantity: qty
                };
            });

            const customerId = psNum(cart.rawCart.id_customer);
            const addressId = psNum(cart.rawCart.id_address_delivery) || 1;
            const carrierId = psNum(cart.rawCart.id_carrier) || 1;

            const orderId = await orderService.createOrder(
                customerId,
                cartId,
                items,
                totalAmount,
                addressId,
                11, // Paiement à distance accepté (corrigé selon utilisateur)
                carrierId,
                'ps_cashondelivery', // Safer module
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
