# Modules Avancés & Outils de Conversion (Haute Probabilité)

Ce document rassemble les dernières fonctionnalités qui transforment un simple site catalogue en une véritable machine de vente (optimisation du panier moyen, SEO, internationalisation).

---

## 1. Produits Similaires & Cross-Selling (Ventes Croisées)
**Pourquoi ?** C'est la méthode n°1 pour augmenter le panier moyen (Average Order Value). Quand le client regarde un t-shirt, on lui propose d'autres t-shirts.

### A. Logique Store (`useProductStore.ts`)
```typescript
const getSimilarProducts = (currentProductId: string, categoryId: string, limit: number = 4) => {
    return allProducts.value
        // Filtrer : même catégorie MAIS exclure le produit actuellement regardé
        .filter(p => String(p.id_category_default) === String(categoryId) && String(p.id) !== String(currentProductId))
        // Mélanger (optionnel) ou prendre les premiers
        .slice(0, limit);
};
```

### B. Intégration Vue (`ProductDetailPage.vue`)
```vue
<template>
    <div class="similar-products" v-if="similarProducts.length > 0">
        <h3>Vous aimerez aussi...</h3>
        <div class="product-grid">
            <ProductCard 
                v-for="prod in similarProducts" 
                :key="prod.id" 
                :product="prod" 
            />
        </div>
    </div>
</template>
<script setup>
import { computed } from 'vue';
const similarProducts = computed(() => 
    productStore.getSimilarProducts(product.value.id, product.value.id_category_default)
);
</script>
```

---

## 2. Multi-Devise & Multi-Langue (Internationalisation)
**Pourquoi ?** Actuellement, le code (ex: `order-service.ts`) force `id_currency: 1` et `id_lang: 1`. Pour vendre à l'international, il faut permettre de switcher.

### A. Configuration globale (`appStore.ts`)
```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAppStore = defineStore('app', () => {
    const currentLang = ref(Number(localStorage.getItem('id_lang')) || 1);
    const currentCurrency = ref(Number(localStorage.getItem('id_currency')) || 1);

    const setLang = (id: number) => {
        currentLang.value = id;
        localStorage.setItem('id_lang', String(id));
        // Ici, forcer le rechargement des produits ou traduire l'interface
        window.location.reload(); 
    };

    return { currentLang, currentCurrency, setLang };
});
```

### B. Adaptation dans les Services API
Il faut modifier toutes les créations de paniers et commandes pour utiliser ces variables dynamiques au lieu d'avoir `1` en dur.
```typescript
// Exemple dans order-service.ts
const appStore = useAppStore();
const payload = {
    cart: {
        id_currency: appStore.currentCurrency,
        id_lang: appStore.currentLang,
        // ...
    }
};
```

---

## 3. SEO & Balises Meta Dynamiques (Référencement Naturel)
**Pourquoi ?** Un site développé en Vue.js (SPA) a souvent du mal avec le SEO. Il est critique de mettre à jour le `<title>` et la `<meta description>` à chaque changement de page produit.

### A. Utilitaire (`seoUtils.ts`)
```typescript
export function updateSEO(title: string, description: string) {
    // Mise à jour du titre de l'onglet
    document.title = `${title} | Ma Boutique PrestaShop`;

    // Mise à jour de la balise meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
}
```

### B. Intégration dans `ProductDetailPage.vue`
```typescript
import { updateSEO } from '@shared/utils/seoUtils';
import { watchEffect } from 'vue';

watchEffect(() => {
    if (product.value) {
        // Supposons que le produit a un champ description courte
        updateSEO(product.value.name, product.value.description_short || 'Découvrez ce superbe produit.');
    }
});
```

---

## 4. Avis Clients & Étoiles (Product Reviews)
**Pourquoi ?** La preuve sociale est le premier déclencheur d'achat. PrestaShop dispose d'un module natif de commentaires (`product_comments`).

### A. Service API (`review-service.ts`)
```typescript
export const reviewService = {
    async getProductReviews(productId: number) {
        // Requiert que le module "Commentaires produits" soit installé et exposé dans l'API
        try {
            return await apiService.fetchList<any>(
                `/product_comments?filter[id_product]=${productId}&display=full`, 
                'product_comments', 
                'product_comment'
            );
        } catch (e) {
            return []; // Fallback si le module n'est pas actif
        }
    }
};
```

### B. Vue (`ProductReviews.vue`)
```vue
<template>
    <div class="reviews">
        <h3>Avis Clients ({{ reviews.length }})</h3>
        
        <!-- Calcul de la moyenne -->
        <div class="average-stars">
            {{ averageGrade }} / 5 ⭐
        </div>

        <div v-for="review in reviews" :key="review.id" class="review-card">
            <h4>{{ review.customer_name }} - {{ review.grade }}⭐</h4>
            <p>{{ review.content }}</p>
        </div>
    </div>
</template>

<script setup>
const averageGrade = computed(() => {
    if (reviews.value.length === 0) return 0;
    const total = reviews.value.reduce((sum, r) => sum + Number(r.grade), 0);
    return (total / reviews.value.length).toFixed(1);
});
</script>
```
