# Documentation Technique Complète - PrestaShop UI

## 1. Introduction au Projet
Le projet **PrestaShop UI** est une interface moderne construite avec **Vue 3 (Composition API)** et **Vite**, conçue pour interagir avec le WebService XML de PrestaShop. Il se divise en deux parties :
- **Back-office** : Gestion des stocks, imports CSV massifs, et commandes.
- **Front-office** : Boutique client avec catalogue, panier, et tunnel d'achat.

### Stack Technique
- **Framework** : Vue.js 3
- **State Management** : Pinia
- **Communication** : Axios + fast-xml-parser
- **Langage** : TypeScript

---

## 2. Architecture du Projet
Le projet suit une architecture **basée sur les fonctionnalités (Feature-based)** :

- `src/backoffice` & `src/frontoffice` : Points d'entrée, layouts et routage spécifiques.
- `src/features/` : Logique métier découpée par domaine.
    - `auth/` : Authentification admin et client.
    - `catalog/` : Gestion des produits, catégories et stocks.
    - `inventory/` : Moteur d'import CSV.
- `src/shared/` : Code réutilisable.
    - `api/` : Client API centralisé.
    - `utils/` : Sérialiseurs XML, extracteurs de données.
    - `types/` : Interfaces TypeScript partagées.

---

## 3. Communication XML & WebService
Le défi majeur de ce projet est la communication en **XML** imposée par PrestaShop.

### 3.1 apiService : Le coeur des échanges
Fichier : `src/shared/api/api-service.ts`
Il encapsule Axios pour transformer automatiquement les objets JS en XML lors de l'envoi, et inversement lors de la réception.

```typescript
// Exemple d'utilisation dans un service
const res = await apiService.get<any>('/products/1');
// La réponse est déjà un objet JS grâce au Serializer
```

### 3.2 Le Serializer
Fichier : `src/shared/utils/serializer.ts`
Il utilise `fast-xml-parser` pour :
1.  Ajouter le tag racine `<prestashop>` requis par l'API.
2.  Gérer les listes (tableaux) de manière consistante.

### 3.3 Extraction de Données Robustes
L'API PrestaShop retourne des structures complexes pour les IDs et les champs multilingues. Utilisez toujours ces utilitaires :
- `extractIdValue(val)` : Pour obtenir l'ID (ignore les attributs xlink).
- `extractLanguageValue(field)` : Pour obtenir le texte (gère les objets multi-langues).

---

## 4. Guide de Modification

### Modifier une Fonction Existante
Si vous souhaitez ajouter un filtre sur la récupération des produits dans `product-service.ts` :

**Avant :**
```typescript
async getAll(): Promise<Product[]> {
    const res = await apiService.get<any>('/products?display=full');
    // ...
}
```

**Après (Ajout d'un filtre pour les produits actifs) :**
```typescript
async getAllActive(): Promise<Product[]> {
    const res = await apiService.get<any>('/products?display=full&filter[active]=1');
    // ... logique de mapping ...
}
```

---

## 5. Guide d'Extension : Ajouter une Fonctionnalité
*Exemple : Ajouter un système de "Commentaires Produits"*

### Étape 1 : Définir le Type
Fichier : `src/shared/types/review.ts`
```typescript
try {
  const orderData = await apiService.get<any>(`/orders/${orderId}?display=full`);
  const order = orderData.prestashop.order;
  const rows = order.associations?.order_rows?.order_row;
  const orderRows = Array.isArray(rows) ? rows : (rows ? [rows] : []);

  for (const row of orderRows) {
    const productId = Number(extractIdValue(row.product_id));
    const attributeId = Number(extractIdValue(row.product_attribute_id) || 0);

    if (!productId) {
      console.warn("Skipping stock restoration: product_id is 0 or invalid", row);
      continue;
    }

    const stockMvt: StockMovement = {
      id_product: productId,
      id_product_attribute: attributeId,
      physical_quantity: Number(row.product_quantity),
      sign: 1, // On remet en stock
      id_stock_mvt_reason: 1,
      date_add: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    await apiService.postStockMvt('/stockmvtapi/stockmvt', { stock_mvt: stockMvt });
  }
} catch (err) {
  console.error("Failed to restore stock for cancelled order:", err);
}
```

### Étape 2 : Créer le Service
Fichier : `src/features/catalog/services/review-service.ts`
```typescript
import apiService from '@shared/api/api-service';

export const reviewService = {
    async getProductReviews(productId: string) {
        // Supposons une ressource personnalisée ou un module PrestaShop
        return await apiService.get(`/product_reviews?filter[id_product]=${productId}`);
    },
    async addReview(payload: any) {
        return await apiService.post('/product_reviews', { product_review: payload });
    }
};
```

### Étape 3 : Créer le Store Pinia
Fichier : `src/features/catalog/stores/reviewStore.ts`
```typescript
import { defineStore } from 'pinia';
import { reviewService } from '../services/review-service';

export const useReviewStore = defineStore('reviews', {
    state: () => ({
        reviews: [] as any[],
        loading: false
    }),
    actions: {
        async fetchReviews(productId: string) {
            this.loading = true;
            try {
                const res = await reviewService.getProductReviews(productId);
                this.reviews = res.prestashop.product_reviews;
            } finally {
                this.loading = false;
            }
        }
    }
});
```

---

## 6. Le Moteur d'Import (Complex Workflow)
Fichier : `src/features/inventory/import/services/productImportService.ts`

L'import se fait en plusieurs étapes critiques pour respecter les contraintes d'intégrité de PrestaShop :
1.  **Validation** : Vérification des colonnes et des formats (dates, prix).
2.  **Taxes** : Création/Récupération des groupes de taxes.
3.  **Catégories** : Création des catégories manquantes.
4.  **Produits** : Création du produit de base.
5.  **Combinaisons** : (Facultatif) Ajout des variantes.

**Exemple de logique séquentielle :**
```typescript
await processTaxes(uniqueTaxes);
await processCategories(uniqueCategories);
await processProducts(cleanRows);
```

---

## 7. Gestion des Taxes et Prix TTC
Dans le WebService PrestaShop, les prix des produits sont retournés par défaut en **Hors Taxes (HT)**. Pour afficher des prix **TTC** dans le Front-office, le projet utilise un service dédié.

### 7.1 taxService
Fichier : `src/features/catalog/services/tax-service.ts`
Ce service récupère les taux de taxe depuis les ressources `/tax_rules` et `/taxes` de PrestaShop et crée une map de correspondance `id_tax_rules_group` -> `taux`.

### 7.2 Application des taxes dans productService
Le `productService` applique automatiquement la taxe lors de la récupération des produits :
```typescript
const taxRate = taxRates.get(taxRuleGroupId) || 0;
const priceHT = parseFloat(p.price || '0');
const priceTTC = priceHT * (1 + taxRate / 100);
// Le produit retourné contient price: priceTTC.toFixed(2)
```

### 7.3 Impacts des déclinaisons
Les déclinaisons (combinations) ont souvent un impact sur le prix exprimé en HT. Dans `ProductDetailPage.vue`, cet impact est également taxé avant d'être ajouté au prix de base TTC du produit pour garantir un affichage exact.

---

## 8. Meilleures Pratiques
- **Toujours utiliser `apiService`** : Ne jamais appeler Axios directement pour garder la sérialisation XML automatique.
- **Dossier `shared`** : Si une logique est utilisée à la fois en Front et Back, elle DOIT être dans `shared`.
- **Types** : Ne jamais utiliser `any` si possible. Définissez les interfaces dans `src/shared/types`.
- **ID PrestaShop** : Toujours convertir en `string` via `extractIdValue` car le parser peut retourner des nombres ou des objets.

---

*Documentation générée pour l'équipe de développement PrestaShop UI.*
