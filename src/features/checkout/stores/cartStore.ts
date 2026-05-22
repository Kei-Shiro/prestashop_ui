import { defineStore } from 'pinia';
import {ref, computed, PropType} from 'vue';
import type { Product } from '@shared/types/product';
import type { CartItem } from '@shared/types/cart';
import { extractIdValue } from '@shared/utils/extractIdValue';
import {orderService} from "@features/checkout/services/order-service";
import apiService from "@shared/api/api-service";
import {ensureArray} from "@shared/utils/arrayUtils";

const STORAGE_PREFIX = 'front_cart_';

export const useCartStore = defineStore('cart', () => {
    /** Clé en cours — identifie l'utilisateur ("anonymous" ou l'id PS) */
    const currentUserKey = ref<string>('anonymous');
    const items = ref<CartItem[]>([]);

    // ─── Persistance ────────────────────────────────────────────

    function _saveToStorage() {
        try {
            localStorage.setItem(
                STORAGE_PREFIX + currentUserKey.value,
                JSON.stringify(items.value)
            );
        } catch (_) { /* quota? ignore */ }
    }

    /**
     * Synchronise le panier local avec PrestaShop pour les utilisateurs connectés.
     * Pour les visiteurs anonymes, le panier reste local jusqu'au checkout.
     */
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
            // Import dynamique pour éviter les dépendances circulaires
            const { orderService } = await import('@features/checkout/services/order-service');
            const existingCartId = await orderService.getLatestOpenCartId(customerId);
            
            // On utilise 0 comme ID d'adresse par défaut pour le panier,
            // l'adresse réelle sera définie au moment du checkout.
            const addressId = 0;

            if (existingCartId) {
                await orderService.updateCart(existingCartId, customerId, cartItems, addressId);
                console.log(`[cartStore] Panier PS ${existingCartId} mis à jour via syncToServer`);
            } else if (cartItems.length > 0) {
                const newCartId = await orderService.createCart(customerId, cartItems, addressId);
                console.log(`[cartStore] Nouveau panier PS ${newCartId} créé via syncToServer`);
            }
        } catch (e) {
            console.error('[cartStore] Erreur lors de la synchronisation du panier avec PS:', e);
        }
    }

    /**
     * Charge le panier d'un utilisateur depuis localStorage.
     * Appelé après login ou restoreSession.
     * @param userKey  String(user.id) pour un client PS, "anonymous" pour visiteur
     * @param mergeAnonymous S'il faut fusionner le panier anonyme courant
     */
    function loadForUser(userKey: string, mergeAnonymous: boolean = false) {
        // Garder une copie du panier anonyme si on doit fusionner
        const anonymousItems = (mergeAnonymous && currentUserKey.value === 'anonymous') ? [...items.value] : [];

        // Sauvegarder le panier courant avant de changer d'utilisateur
        _saveToStorage();
        currentUserKey.value = userKey;
        try {
            const stored = localStorage.getItem(STORAGE_PREFIX + userKey);
            const loadedItems = stored ? (JSON.parse(stored) as CartItem[]) : [];
            
            // Migration/Fix: S'assurer que chaque item a un unit_price
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

        // Fusionner si demandé
        if (mergeAnonymous && anonymousItems.length > 0) {
            let hasChanges = false;
            anonymousItems.forEach(anonItem => {
                const existing = items.value.find(i => 
                    String(i.product.id_product) === String(anonItem.product.id_product) &&
                    String(i.id_product_attribute || '0') === String(anonItem.id_product_attribute || '0')
                );
                
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
            
            if (hasChanges) {
                syncToServer();
            }

            // Vider le panier anonyme local pour qu'il ne réapparaisse pas
            localStorage.removeItem(STORAGE_PREFIX + 'anonymous');
        }
    }

    function clearAnonymousCart() {
        if (currentUserKey.value === 'anonymous') {
            items.value = [];
        }
        localStorage.removeItem(STORAGE_PREFIX + 'anonymous');
        _saveToStorage();
    }

    /**
     * Fusionne les articles venant du serveur (PS) avec le panier local.
     * En cas de doublon, la quantité du serveur est prioritaire (synchronisation).
     */
    function mergeServerItems(serverItems: CartItem[]) {
        if (serverItems.length === 0) return;

        serverItems.forEach(serverItem => {
            const existing = items.value.find(
                i => String(i.product.id_product) === String(serverItem.product.id_product) &&
                     String(i.id_product_attribute || '0') === String(serverItem.id_product_attribute || '0')
            );
            if (existing) {
                // Synchronisation : on prend la quantité du serveur pour éviter les doublons lors des reconnexions
                existing.quantity = serverItem.quantity;
                // On met à jour aussi le prix au cas où
                existing.unit_price = serverItem.unit_price;
                existing.total_price = existing.unit_price * existing.quantity;
            } else {
                items.value.push(serverItem);
            }
        });

        _saveToStorage();
        console.log(`[cartStore] Panier synchronisé avec PS : ${serverItems.length} article(s) traités`);
        
        // On ne resync pas vers le serveur ici car les données viennent du serveur
    }

    // ─── Computed ────────────────────────────────────────────────

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => {
            const price = Number(item.unit_price) || 0;
            const qty = Number(item.quantity) || 0;
            return total + (price * qty);
        }, 0);
    });

    const totalItems = computed(() =>
        items.value.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
    );

    // ─── Drawer ──────────────────────────────────────────────────

    const isCartDrawerOpen = ref(false);
    function toggleCartDrawer() { isCartDrawerOpen.value = !isCartDrawerOpen.value; }
    function openCartDrawer()   { isCartDrawerOpen.value = true; }
    function closeCartDrawer()  { isCartDrawerOpen.value = false; }

    // ─── Mutations (avec sauvegarde automatique et sync) ─────────

    async function addProduct(product: Product, quantity: number = 1, id_product_attribute: string = '0', unitPrice?: number) {
        const existing = items.value.find(
            i => String(i.product.id_product) === String(product.id_product) &&
                 String(i.id_product_attribute || '0') === String(id_product_attribute || '0')
        );

        const finalPrice = unitPrice !== undefined ? unitPrice : (typeof product.price === 'string' ? parseFloat(product.price) : product.price);

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

    async function updateQuantity(productId: string | number, quantity: number, id_product_attribute: string = '0') {
        const existing = items.value.find(
            i => String(i.product.id_product) === String(productId) &&
                 String(i.id_product_attribute || '0') === String(id_product_attribute || '0')
        );
        if (existing) {
            if (quantity <= 0) {
                await removeProduct(productId, id_product_attribute);
                return;
            }
            existing.quantity = quantity;
            existing.total_price = existing.unit_price * existing.quantity;
            _saveToStorage();
            await syncToServer();
        }
    }

    async function removeProduct(productId: string | number, id_product_attribute: string = '0') {
        items.value = items.value.filter(
            i => !(String(i.product.id_product) === String(productId) && String(i.id_product_attribute || '0') === String(id_product_attribute || '0'))
        );
        _saveToStorage();
        await syncToServer();
    }


    async function clearCart() {
        items.value = [];
        _saveToStorage();
        await syncToServer();
    }

    async function reorder (orderId: number, multpli: number){

        const orderDetails: any = await apiService.get(`/orders/${orderId}`)
        const rows = orderDetails.associations?.order_rows?.order_row;

        // Parcourir les lignes et ajouter au panier
        for (const row of rows) {

                 const productmodel: any  =  await apiService.get(`/stock_availables?filter[id_product]=${row.product_id}&display=full`);
                 const products = ensureArray(productmodel.prestashop.stock_availables.stock_available)

           if(products) {
               for(const product of products) {

               }
           }






            await orderService.createCart(
                row.product_id,
                row.product_quantity,
                row.product_attribute_id
            );
        }
        console.log("Produits ajoutés au panier !");
    };

    /**
     * Remplace les articles du panier par ceux chargés depuis le serveur PS.
     * N'écrase que si le panier local est vide (localStorage = priorité).
     */
    function setItemsFromServer(serverItems: CartItem[]) {
        if (serverItems.length > 0 && items.value.length === 0) {
            items.value = serverItems;
            _saveToStorage();
            console.log(`[cartStore] Panier restauré depuis PS : ${serverItems.length} article(s)`);
        }
    }

    return {
        items,
        totalAmount,
        totalItems,
        currentUserKey,
        isCartDrawerOpen,
        toggleCartDrawer,
        openCartDrawer,
        closeCartDrawer,
        addProduct,
        updateQuantity,
        removeProduct,
        clearCart,
        loadForUser,
        clearAnonymousCart,
        mergeServerItems,
        setItemsFromServer,
    };
});