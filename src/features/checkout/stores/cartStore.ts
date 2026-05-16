import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@shared/types/product';
import type { CartItem } from '@shared/types/cart';

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
            items.value = stored ? (JSON.parse(stored) as CartItem[]) : [];
        } catch (_) {
            items.value = [];
        }

        // Fusionner si demandé
        if (mergeAnonymous && anonymousItems.length > 0) {
            anonymousItems.forEach(anonItem => {
                const existing = items.value.find(i => String(i.product.id_product) === String(anonItem.product.id_product));
                if (existing) {
                    existing.quantity += anonItem.quantity;
                    const price = typeof existing.product.price === 'string' ? parseFloat(existing.product.price) : existing.product.price;
                    existing.total_price = price * existing.quantity;
                } else {
                    items.value.push({ ...anonItem });
                }
            });
            _saveToStorage();

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
     */
    function mergeServerItems(serverItems: CartItem[]) {
        if (serverItems.length === 0) return;

        serverItems.forEach(serverItem => {
            const existing = items.value.find(
                i => String(i.product.id_product) === String(serverItem.product.id_product)
            );
            if (existing) {
                // On peut choisir d'additionner ou de prendre le max. Ici, on additionne pour suivre la logique de fusion.
                existing.quantity += serverItem.quantity;
                const price = typeof existing.product.price === 'string'
                    ? parseFloat(existing.product.price)
                    : existing.product.price;
                existing.total_price = price * existing.quantity;
            } else {
                items.value.push(serverItem);
            }
        });

        _saveToStorage();
        console.log(`[cartStore] Panier fusionné avec PS : +${serverItems.length} article(s)`);
    }

    // ─── Computed ────────────────────────────────────────────────

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => {
            const price = typeof item.product.price === 'string'
                ? parseFloat(item.product.price)
                : item.product.price;
            return total + (price * item.quantity);
        }, 0);
    });

    const totalItems = computed(() =>
        items.value.reduce((total, item) => total + item.quantity, 0)
    );

    // ─── Drawer ──────────────────────────────────────────────────

    const isCartDrawerOpen = ref(false);
    function toggleCartDrawer() { isCartDrawerOpen.value = !isCartDrawerOpen.value; }
    function openCartDrawer()   { isCartDrawerOpen.value = true; }
    function closeCartDrawer()  { isCartDrawerOpen.value = false; }

    // ─── Mutations (avec sauvegarde automatique) ─────────────────

    function addProduct(product: Product, quantity: number = 1) {
        const existing = items.value.find(
            i => String(i.product.id_product) === String(product.id_product)
        );
        const price = typeof product.price === 'string'
            ? parseFloat(product.price)
            : product.price;
        if (existing) {
            existing.quantity += quantity;
            existing.total_price = price * existing.quantity;
        } else {
            items.value.push({ product, quantity, total_price: price * quantity });
        }
        _saveToStorage();
        openCartDrawer();
    }

    function updateQuantity(productId: string | number, quantity: number) {
        const existing = items.value.find(
            i => String(i.product.id_product) === String(productId)
        );
        if (existing) {
            if (quantity <= 0) {
                removeProduct(productId);
                return;
            }
            existing.quantity = quantity;
            const price = typeof existing.product.price === 'string'
                ? parseFloat(existing.product.price)
                : existing.product.price;
            existing.total_price = price * existing.quantity;
            _saveToStorage();
        }
    }

    function removeProduct(productId: string | number) {
        items.value = items.value.filter(
            i => String(i.product.id_product) !== String(productId)
        );
        _saveToStorage();
    }

    function clearCart() {
        items.value = [];
        _saveToStorage();
    }

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

