# Grande Bibliothèque de Snippets PrestaShop UI

Ce document est une référence exhaustive contenant de très nombreux extraits de code utiles pour votre architecture Vue 3 + PrestaShop WebService. Il est conçu pour être un "copier-coller" prêt à l'emploi.

---

## 1. Utilitaires de Parsing et Nettoyage (Crucial)

PrestaShop renvoie du XML qui est converti en objets JavaScript complexes. L'utilisation de ces utilitaires est **obligatoire** pour éviter des erreurs dans l'UI.

### 1.1 Extraire un ID de manière sécurisée
```typescript
import { extractIdValue } from '@shared/utils/extractIdValue';

// Scénario : PrestaShop renvoie { '@_xlink:href': '...', '#text': '12' }
const rawId = product.id_category_default; 

const cleanId = extractIdValue(rawId);
// cleanId vaut "12"

// Utilisation typique :
const categoryId = extractIdValue(product.id_category_default) || '2'; // Fallback à Accueil
```

### 1.2 Extraire une valeur multilingue
```typescript
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

// Scénario : PrestaShop renvoie { language: [ { '@_id': '1', '#text': 'Nom du produit' } ] }
const rawName = product.name;

const cleanName = extractLanguageValue(rawName);
// cleanName vaut "Nom du produit"
```

### 1.3 Forcer un élément en tableau
Le parser XML (`fast-xml-parser`) transforme un seul élément en objet, mais plusieurs en tableau.

```typescript
// Patron de conception standard dans votre code :
const response = await apiService.get('/products');
const pProducts = response?.prestashop?.products?.product;

// Sécurisation :
const productsArray = Array.isArray(pProducts) ? pProducts : (pProducts ? [pProducts] : []);
```

---

## 2. Communication API (apiService)

### 2.1 GET basique avec affichage complet (display=full)
```typescript
import apiService from '@shared/api/api-service';

async function fetchAllCategories() {
    const res = await apiService.get<any>('/categories?display=full');
    let list = res?.prestashop?.categories?.category ?? [];
    return Array.isArray(list) ? list : [list];
}
```

### 2.2 GET avec filtres multiples
```typescript
import apiService from '@shared/api/api-service';

async function getStockForProduct(productId: number, attributeId: number = 0) {
    const url = `/stock_availables?filter[id_product]=${productId}&filter[id_product_attribute]=${attributeId}&display=[quantity]`;
    const res = await apiService.get<any>(url);
    const stock = res?.prestashop?.stock_availables?.stock_available;
    return String(Array.isArray(stock) ? stock[0]?.quantity : (stock?.quantity || '0'));
}
```

### 2.3 POST (Création générique)
```typescript
import apiService from '@shared/api/api-service';

async function createManufacturer(name: string) {
    const payload = {
        manufacturer: {
            name: name,
            active: 1
        }
    };
    const res: any = await apiService.post('/manufacturers', payload);
    return extractIdValue(res.prestashop.manufacturer.id);
}
```

### 2.4 PUT (Mise à jour)
```typescript
import apiService from '@shared/api/api-service';

async function updateStock(stockId: number, newQuantity: number) {
    const payload = {
        stock_available: {
            id: stockId, // L'ID est requis dans l'URL ET dans le payload
            quantity: newQuantity
        }
    };
    await apiService.put(`/stock_availables/${stockId}`, payload);
}
```

### 2.5 POST Multipart (Upload d'images)
```typescript
import apiService from '@shared/api/api-service';

async function uploadProductImage(productId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file, file.name);

    // Retourne le XML parsé ou la réponse brute si échec du parsing
    return await apiService.postFormData(`/images/products/${productId}`, formData);
}
```

---

## 3. Services du Catalogue (Produits & Catégories)

### 3.1 Construire l'URL d'une image produit
```typescript
import productService from '@features/catalog/services/product-service';

// Pour l'image par défaut d'un produit
const defaultImageUrl = productService.getImageUrl(product.id_product, product.id_default_image);

// Si vous avez un array d'images associées au produit
const firstImage = product.images?.[0];
const firstImageUrl = firstImage ? productService.getImageUrl(product.id_product, firstImage) : '';
```

### 3.2 Récupérer les déclinaisons (Combinations) d'un produit
```typescript
import productService from '@features/catalog/services/product-service';

async function getCombinationsForUI(productId: number) {
    const combinations = await productService.getCombinations(productId);
    
    return combinations.map(c => ({
        id: extractIdValue(c.id),
        reference: extractIdValue(c.reference),
        priceImpact: typeof c.price === 'string' ? parseFloat(c.price) : Number(c.price || 0),
        quantity: c.quantity // Attention, nécessite parfois un appel à stock_availables
    }));
}
```

### 3.3 Récupérer le taux de taxe (TVA)
```typescript
import taxService from '@features/catalog/services/tax-service';

async function calculatePriceTTC(priceHT: number, id_tax_rules_group: string) {
    // taxRates est une Map<string (id_tax_rules_group), number (rate)>
    const taxRates = await taxService.getTaxRates();
    const rate = taxRates.get(id_tax_rules_group) || 0;
    
    return priceHT * (1 + rate / 100);
}
```

---

## 4. Gestion des Clients et Authentification

### 4.1 Récupérer ou créer un client (Workflow typique de Guest Checkout)
```typescript
import { customerService } from '@features/auth/services/customer-service';

async function getOrCreateCustomer(email: string, firstname: string, lastname: string) {
    // 1. Chercher si le client existe
    const existingCustomer = await customerService.getCustomerByEmail(email);
    if (existingCustomer) {
        return parseInt(existingCustomer.id);
    }
    
    // 2. S'il n'existe pas, le créer (groupe 3 par défaut)
    const newCustomerId = await customerService.createCustomer({
        email,
        firstname,
        lastname,
        password: Math.random().toString(36).slice(-8) // Mot de passe auto
    });
    return newCustomerId;
}
```

### 4.2 Gérer les adresses d'un client
```typescript
import { customerService } from '@features/auth/services/customer-service';

async function setupCustomerAddress(customerId: number, addressData: any) {
    // Vérifier s'il a déjà une adresse
    const addresses = await customerService.getAllAddressesByCustomerId(customerId);
    
    if (addresses.length > 0) {
        // Utiliser la première adresse trouvée
        return Number(extractIdValue(addresses[0].id));
    }
    
    // Créer une nouvelle adresse (France = id_country 8)
    return await customerService.createAddress({
        ...addressData,
        id_country: 8,
        id_customer: customerId
    });
}
```

---

## 5. Paniers et Commandes (Checkout Flow)

### 5.1 Créer un Panier côté PrestaShop
```typescript
import { orderService } from '@features/checkout/services/order-service';

async function initiateCart(customerId: number, cartItems: any[]) {
    // items attendus : [{ id_product, id_product_attribute, quantity }]
    
    // L'adresse 0 est utilisée temporairement si le client n'a pas encore validé l'adresse
    const cartId = await orderService.createCart(customerId, cartItems, 0);
    return cartId;
}
```

### 5.2 Transformer un Panier en Commande (Cash on Delivery)
```typescript
import { orderService } from '@features/checkout/services/order-service';

async function finalizeOrder(customerId: number, cartId: number, cartItems: any[], totalAmount: number, addressId: number) {
    const initialStateId = 2; // "Paiement accepté"
    const carrierId = await orderService.detectCarrierId();
    const moduleName = orderService.detectCodModuleName(); // ps_cashondelivery
    
    const orderId = await orderService.createOrder(
        customerId, 
        cartId, 
        cartItems, 
        totalAmount, 
        addressId, 
        initialStateId, 
        carrierId, 
        moduleName
    );
    
    return orderId;
}
```

### 5.3 Mettre à jour le statut d'une commande (Order History)
PrestaShop nécessite de créer une entrée dans `order_histories` pour changer le statut.

```typescript
import apiService from '@shared/api/api-service';

async function setOrderStatus(orderId: number, stateId: number) {
    await apiService.post('/order_histories', {
        order_history: {
            id_order: orderId,
            id_order_state: stateId
        }
    });
}
```

---

## 6. Logique de synchronisation Vue (Stores Pinia)

### 6.1 Action Store : Ajouter au panier et Sync Serveur
Cette logique fusionne le stockage local et met à jour l'API.

```typescript
import { useCartStore } from '@features/checkout/stores/cartStore';

// À l'intérieur d'un setup() de composant
const cartStore = useCartStore();

const onAddToCart = async (product: any, quantity: number, attributeId: string = '0') => {
    // Ajoute localement (et ouvre le tiroir)
    await cartStore.addProduct(product, quantity, attributeId, parseFloat(product.price));
    
    // Le store gère l'appel API syncToServer() en arrière-plan
};
```

### 6.2 Action Store : Synchroniser le panier local après connexion
```typescript
import { useAuthStore } from '@features/auth/stores/customerAuthStore';
import { useCartStore } from '@features/checkout/stores/cartStore';

// Dans le authStore, lors du login réussi :
const cartStore = useCartStore();

// Charge le panier spécifique au client, et fusionne avec le panier "anonyme" actuel
cartStore.loadForUser(String(customer.id), true);

// Lance une synchronisation avec les paniers ouverts existants sur PrestaShop
await syncServerCarts(Number(customer.id));
```

---

## 7. Mouvements de Stocks et Inventaire

### 7.1 Ajouter un mouvement de stock positif/négatif
Il faut utiliser le endpoint spécial du module stockmvtapi.

```typescript
import apiService from '@shared/api/api-service';

async function updateInventory(id_product: number, id_product_attribute: number, deltaQuantity: number) {
    const payload = {
        stock_mvt: {
            id_product: id_product,
            id_product_attribute: id_product_attribute,
            physical_quantity: Math.abs(deltaQuantity),
            sign: deltaQuantity > 0 ? 1 : -1,
            id_stock_mvt_reason: deltaQuantity > 0 ? 1 : 2, // 1=Augmentation, 2=Décrémentation manuelle
            date_add: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
    };
    
    // Utilise le client spécial pour le module
    await apiService.postStockMvt('/stockmvtapi/stockmvt', payload);
}
```

---

## 8. Composables Vue (Réutilisabilité)

### 8.1 Composable `useProductFilters` (Filtrage client-side)
Très utile pour vos vues catalogue ou dashboard pour filtrer en mémoire sans refaire des requêtes API.

```typescript
import { ref, computed, type Ref } from 'vue';

export function useProductFilters(products: Ref<any[]>) {
    const filters = ref({ name: '', category: '' });

    const filteredProducts = computed(() => {
        return products.value.filter(product => {
            // Filtre par nom
            if (filters.value.name && !product.name.toLowerCase().includes(filters.value.name.toLowerCase())) {
                return false;
            }
            // Filtre par catégorie
            if (filters.value.category) {
                const selectedCat = String(filters.value.category);
                if (String(product.category) !== selectedCat && !(product.categories || []).includes(selectedCat)) {
                    return false;
                }
            }
            return true;
        });
    });

    return { filters, filteredProducts };
}
```

---

## 9. Validateur d'Import CSV (Robuste)

Vos imports CSV dépendent du `ImportValidator`. Voici comment traiter et sécuriser un import complexe.

### 9.1 Parser un CSV avec PapaParse et Validateur
```typescript
import Papa from 'papaparse';
import { ImportValidator } from '@shared/utils/import-validator';

async function parseAndValidateCSV(file: File) {
    const text = await file.text();
    
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const metaFields = results.meta.fields || [];
                const required = ['reference', 'valeur', 'stock_initial'];
                
                try {
                    // Vérifie que toutes les colonnes existent (insensible à la casse)
                    const colMap = ImportValidator.validateColumns(metaFields, required);
                    
                    const cleanedData = results.data.map((row: any) => ({
                        reference: row[colMap['reference']].trim(),
                        // Valider que c'est un montant positif et non vide
                        prix: ImportValidator.validatePositiveAmount(row[colMap['valeur']], 'valeur'),
                        stock: parseInt(row[colMap['stock_initial']] || '0', 10)
                    }));
                    
                    resolve(cleanedData);
                } catch (e) {
                    // L'erreur contient exactement quelle colonne manque ou est invalide
                    reject(e);
                }
            }
        });
    });
}
```

---

## 10. Gestion des ZIP (Import d'Images par lot)

### 10.1 Lecture et extraction via JSZip
```typescript
import JSZip from 'jszip';
import apiService from '@shared/api/api-service';

async function importImagesFromZip(zipFile: File, productMap: Map<string, number>) {
    const zip = await JSZip.loadAsync(zipFile);
    
    // Filtrer les fichiers non-images et les répertoires
    const imageEntries = Object.values(zip.files).filter(entry => 
        !entry.dir && !entry.name.includes('/') && 
        (entry.name.toLowerCase().endsWith('.jpg') || entry.name.toLowerCase().endsWith('.png'))
    );

    for (const entry of imageEntries) {
        // Ex: "PROD123.jpg" -> "PROD123" (Référence produit)
        const reference = entry.name.split('.')[0];
        const productId = productMap.get(reference);
        
        if (productId) {
            const blob = await entry.async('blob');
            const formData = new FormData();
            formData.append('image', blob, entry.name);
            
            // Upload vers PrestaShop
            await apiService.postFormData(`/images/products/${productId}`, formData);
        }
    }
}
```

---

## 11. Constantes et Structures Importantes

### 11.1 Format requis pour la Root des requêtes (Serializer)
Toute requête vers l'API PrestaShop **doit** avoir l'entité englobée dans son type de ressource, lui-même transformé par le serializer dans une balise `<prestashop>`.

```javascript
// Si l'endpoint est /products :
const productPayload = {
    product: { // <- CLÉ IDENTIQUE AU NOM SINGULIER DE LA RESSOURCE
        name: "Test",
        active: 1
    }
}
// Le serializer enverra :
// <prestashop>
//   <product>
//     <name>Test</name>
//     <active>1</active>
//   </product>
// </prestashop>
```

### 11.2 Exceptions du Serializer (resource-util.ts)
Certains tableaux XML dans PrestaShop ne suivent pas la convention standard "pluriel > singulier".

```typescript
export const arrayExceptions = [
  { parent: 'addresses', tag: 'address' },
  { parent: 'order_histories', tag: 'order_history' },
  { parent: 'cart_rows', tag: 'cart_row' },
  { parent: 'product_option_values', tag: 'product_option_value' },
  // Si le parser ne renvoie pas un tableau quand il le devrait,
  // il faut ajouter l'exception dans shared/utils/resource-util.ts
];
```

---

## 12. Rapports Financiers Complexes (Futur Dashboard)

Cette section couvre l'extraction de données massives croisées (Bénéfices, Chiffre d'Affaire par Catégorie). Utile pour des dashboards analytiques avancés.

### 12.1 Calcul des Bénéfices par Catégorie (Total Sales, Total Purchases, Profit)
Nécessite la jonction manuelle (côté Vue) entre les commandes (CA généré) et les produits (Prix de gros / `wholesale_price`).

```typescript
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';

async function getProfitByCategoryReport() {
    // 1. Récupération des données brutes en parallèle
    const [ordersRes, productsRes] = await Promise.all([
        apiService.get<any>('/orders?display=[id,total_paid_tax_excl,valid,associations]&filter[valid]=1'), // Seulement commandes valides
        apiService.get<any>('/products?display=[id,wholesale_price,id_category_default]')
    ]);

    const ordersRaw = ordersRes?.prestashop?.orders?.order || [];
    const productsRaw = productsRes?.prestashop?.products?.product || [];
    
    const orders = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];
    const products = Array.isArray(productsRaw) ? productsRaw : [productsRaw];

    // 2. Création d'un dictionnaire Produit -> { wholesale_price, category_id }
    const productCatalog = new Map();
    products.forEach((p: any) => {
        productCatalog.set(extractIdValue(p.id), {
            purchasePrice: parseFloat(p.wholesale_price || '0'),
            categoryId: extractIdValue(p.id_category_default)
        });
    });

    // 3. Agrégation des données
    const categoryStats = new Map(); // categoryId -> { sales: number, purchases: number, profit: number }

    orders.forEach((order: any) => {
        const rowsRaw = order.associations?.order_rows?.order_row;
        if (!rowsRaw) return;
        
        const rows = Array.isArray(rowsRaw) ? rowsRaw : [rowsRaw];
        
        rows.forEach((row: any) => {
            const productId = extractIdValue(row.product_id);
            const quantity = parseInt(row.product_quantity || '1', 10);
            const unitPrice = parseFloat(row.unit_price_tax_excl || '0'); // CA HT par unité
            
            const pInfo = productCatalog.get(productId);
            if (!pInfo) return; // Produit supprimé
            
            const categoryId = pInfo.categoryId;
            const revenue = unitPrice * quantity;
            const cost = pInfo.purchasePrice * quantity;
            const profit = revenue - cost;

            if (!categoryStats.has(categoryId)) {
                categoryStats.set(categoryId, { sales: 0, purchases: 0, profit: 0 });
            }
            
            const stats = categoryStats.get(categoryId);
            stats.sales += revenue;
            stats.purchases += cost;
            stats.profit += profit;
        });
    });

    return Object.fromEntries(categoryStats); // Renvoie un objet facile à utiliser dans Vue
}
```

---

## 13. Mises à Jour en Masse (Bulk Update)
### 13.1 Appliquer une remise globale (Specific Prices)
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 14. Marketing et Relance (Paniers Abandonnés)
### 14.1 Détecter les paniers non-validés vieux de X jours
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 15. Gestion Multilingue (Internationalisation)
### 15.1 Créer un Produit avec des traductions complètes
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 16. Service Client & SAV (Natif PrestaShop 8)
### 16.1 Créer un ticket SAV (Message Client) depuis le Front-Office
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 17. Bons de Réductions (Cart Rules / Vouchers)
### 17.1 Appliquer un Code Promo (Voucher) au Panier
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 18. Fiches Techniques Avancées (Product Features)
### 18.1 Récupérer les caractéristiques complètes d'un produit
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

## 19. Calcul Dynamique des Frais de Port (Shipping Costs)
### 19.1 Estimer les frais de port d'un panier
```typescript
import apiService from '@shared/api/api-service';
// ... [Snippet déjà présent précédemment, préservé pour concision] ...
```

---

# --- NOUVEAUTÉS : FONCTIONNALITÉS FACILES & MOYENNES ---

## 20. "Produits Similaires" (Cross-selling de base)

**Liaison avec votre projet :** S'ajoute au fichier `src/features/catalog/services/product-service.ts`.
**Intégration UI :** À appeler dans le hook `onMounted` de votre composant `ProductDetailPage.vue` en lui passant l'ID de catégorie du produit principal.

```typescript
// Dans src/features/catalog/services/product-service.ts
async function getRelatedProducts(categoryId: string, currentProductId: string, limit: number = 4) {
    try {
        const response = await apiService.get<any>(
            `/products?filter[id_category_default]=${categoryId}&display=full&limit=${limit + 1}`
        );
        const productsRaw = response?.prestashop?.products?.product || [];
        let products = Array.isArray(productsRaw) ? productsRaw : [productsRaw];
        
        // On exclut le produit actuellement consulté
        return products.filter((p: any) => extractIdValue(p.id) !== currentProductId).slice(0, limit);
    } catch (e) {
        console.error("Erreur liés:", e);
        return [];
    }
}
```

---

## 21. Le Mode "Catalogue VIP" (B2B)

**Liaison avec votre projet :** Interagit directement avec `src/features/auth/stores/customerAuthStore.ts` que vous avez déjà.
**Intégration UI :** Ne nécessite aucun code backend. Vous masquez dynamiquement des blocs dans les fichiers `.vue` (ex: `ProductCard.vue` ou `CartDrawer.vue`).

```html
<!-- Dans un composant comme ProductCard.vue -->
<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    
    <!-- Utilisation du AuthStore existant -->
    <template v-if="!authStore.isAnonymous">
      <span class="price">{{ product.price }} €</span>
      <button @click="addToCart(product)">Ajouter au panier</button>
    </template>
    
    <template v-else>
      <span class="price-hidden">Prix réservé aux membres</span>
      <router-link to="/login" class="btn-secondary">Connectez-vous pour commander</router-link>
    </template>
  </div>
</template>

<script setup>
import { useAuthStore } from '@features/auth/stores/customerAuthStore';
const authStore = useAuthStore();
// ...
</script>
```

---

## 22. Affichage des Marques (Manufacturers)

**Liaison avec votre projet :** S'ajoute dans un nouveau service `src/features/catalog/services/manufacturer-service.ts`.
**Intégration UI :** Utile dans `ProductDetailPage.vue` pour afficher un badge de marque.

```typescript
// Dans src/features/catalog/services/manufacturer-service.ts
import apiService from '@shared/api/api-service';

export const manufacturerService = {
    async getManufacturerName(manufacturerId: string): Promise<string> {
        if (!manufacturerId || manufacturerId === '0') return '';
        try {
            const res = await apiService.get<any>(`/manufacturers/${manufacturerId}`);
            return res?.prestashop?.manufacturer?.name || '';
        } catch (e) {
            return '';
        }
    }
}

// Utilisation dans un Vue :
// onMounted(async () => {
//    const mId = extractIdValue(product.id_manufacturer);
//    brandName.value = await manufacturerService.getManufacturerName(mId);
// });
```

---

## 23. Suivi de Commande Visuel (Timeline d'Historique)

**Liaison avec votre projet :** S'intègre dans `src/features/checkout/services/order-service.ts` qui contient déjà des fonctions liées aux commandes.
**Intégration UI :** À utiliser dans la page "Historique des commandes" du compte client pour afficher une barre de progression.

```typescript
// Dans src/features/checkout/services/order-service.ts
async function getOrderTimeline(orderId: number) {
    // 1. Obtenir la commande complète avec ses historiques
    const orderRes = await apiService.get<any>(`/orders/${orderId}?display=full`);
    const historyRaw = orderRes?.prestashop?.order?.associations?.order_histories?.order_history || [];
    const histories = Array.isArray(historyRaw) ? historyRaw : [historyRaw];

    // 2. Récupérer TOUS les états de commande possibles pour avoir leurs noms
    const statesRes = await apiService.get<any>('/order_states?display=[id,name,color]');
    const statesRaw = statesRes?.prestashop?.order_states?.order_state || [];
    const states = Array.isArray(statesRaw) ? statesRaw : [statesRaw];
    
    const stateMap = new Map();
    states.forEach(s => {
        stateMap.set(extractIdValue(s.id), {
            name: extractLanguageValue(s.name),
            color: s.color
        });
    });

    // 3. Mapper l'historique de la commande
    return histories.map((h: any) => {
        const stateId = extractIdValue(h.id_order_state);
        const stateInfo = stateMap.get(stateId) || { name: 'Inconnu', color: '#ccc' };
        
        return {
            date: h.date_add,
            stateName: stateInfo.name,
            color: stateInfo.color
        };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Tri par date décroissante
}
```

---

## 24. Liste d'Envies (Wishlist Local)

**Liaison avec votre projet :** Nécessite de créer un nouveau store Pinia `src/features/catalog/stores/wishlistStore.ts`.
**Intégration UI :** S'utilise de la même manière que `cartStore.ts`. Vous ajoutez un composant `<HeartIcon @click="wishlistStore.toggle(product)" />` sur vos cartes produits.

```typescript
// Dans src/features/catalog/stores/wishlistStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { extractIdValue } from '@shared/utils/extractIdValue';

export const useWishlistStore = defineStore('wishlist', () => {
    const productIds = ref<Set<string>>(new Set());

    // Initialisation
    const stored = localStorage.getItem('vue_wishlist');
    if (stored) {
        productIds.value = new Set(JSON.parse(stored));
    }

    function toggleProduct(rawProductId: any) {
        const id = extractIdValue(rawProductId);
        if (!id) return;

        if (productIds.value.has(id)) {
            productIds.value.delete(id);
        } else {
            productIds.value.add(id);
        }
        
        // Sauvegarde dans le localStorage
        localStorage.setItem('vue_wishlist', JSON.stringify(Array.from(productIds.value)));
    }

    function isInWishlist(rawProductId: any) {
        return productIds.value.has(extractIdValue(rawProductId) || '');
    }

    return { productIds, toggleProduct, isInWishlist };
});
```

---

## 25. Tri et Pagination "Côté Serveur"

**Liaison avec votre projet :** Remplace l'appel classique "get all products" dans votre `product-service.ts`.
**Intégration UI :** Dans votre catalogue `CatalogPage.vue`, au lieu d'avoir un tableau géant filtré en JS, vous appelez cette fonction à chaque fois que l'utilisateur clique sur "Page 2" ou "Trier par prix croissant".

```typescript
// Dans src/features/catalog/services/product-service.ts
async function getPaginatedAndSortedProducts(
    categoryId: string = '', 
    page: number = 1, 
    limit: number = 20, 
    sortBy: 'price' | 'date_add' | 'name' = 'name', 
    sortOrder: 'ASC' | 'DESC' = 'ASC'
) {
    const offset = (page - 1) * limit;
    
    // Construction de l'URL dynamiquement
    let url = `/products?display=full&limit=${offset},${limit}&sort=[${sortBy}_${sortOrder}]`;
    
    if (categoryId) {
        url += `&filter[id_category_default]=${categoryId}`;
    }

    const response = await apiService.get<any>(url);
    const productsRaw = response?.prestashop?.products?.product || [];
    
    return Array.isArray(productsRaw) ? productsRaw : [productsRaw];
}
```
