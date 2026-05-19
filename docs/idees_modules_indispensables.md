# Les Modules "Indispensables" (Haute Probabilité)

Ce document détaille les modules qui sont **quasiment obligatoires** sur un site e-commerce en production, et qui complètent directement les fonctionnalités que nous avons déjà créées. 

---

## 1. Module "Carnet d'Adresses Client" (Très Haute Probabilité)
**Pourquoi ?** Actuellement, le processus de commande crée potentiellement une adresse par défaut. Un vrai client doit pouvoir gérer plusieurs adresses (Domicile, Bureau) et choisir laquelle utiliser au moment du paiement.

### A. API Service (`address-service.ts`)
```typescript
import apiService from '@shared/api/api-service';

export const addressService = {
    // Récupérer toutes les adresses d'un client spécifique
    async getCustomerAddresses(customerId: number) {
        return await apiService.fetchList<any>(
            `/addresses?filter[id_customer]=${customerId}&filter[deleted]=0&display=full`, 
            'addresses', 
            'address'
        );
    },
    
    // Créer une nouvelle adresse
    async createAddress(addressData: any) {
        const payload = { address: addressData };
        return await apiService.post('/addresses', payload);
    },

    // Supprimer (soft delete) une adresse
    async deleteAddress(addressId: number) {
        const payload = { address: { id: addressId, deleted: 1 } };
        return await apiService.put(`/addresses/${addressId}`, payload);
    }
};
```

### B. Vue (Front-Office) : `AddressManager.vue`
```vue
<template>
    <div class="address-book">
        <h3>Mes Adresses de livraison</h3>
        <div class="address-grid">
            <div v-for="address in addresses" :key="address.id" class="address-card">
                <h4>{{ address.alias }}</h4>
                <p>{{ address.firstname }} {{ address.lastname }}</p>
                <p>{{ address.address1 }}</p>
                <p>{{ address.postcode }} {{ address.city }}</p>
                <button @click="deleteAddress(address.id)">Supprimer</button>
            </div>
            
            <button class="add-new" @click="showAddForm = true">+ Ajouter une adresse</button>
        </div>
    </div>
</template>
```

---

## 2. Module "Timeline de Suivi de Commande" (Order Tracking)
**Pourquoi ?** Le client Front-Office voit le statut actuel ("Paiement accepté"). Mais un vrai client veut voir l'historique complet ("Préparation" -> "Expédié" -> "Livré") sous forme de timeline.

### A. API Service (`order-history-service.ts`)
```typescript
export const orderHistoryService = {
    async getOrderTimeline(orderId: number) {
        // L'endpoint order_histories contient chaque changement de statut avec sa date
        const histories = await apiService.fetchList<any>(
            `/order_histories?filter[id_order]=${orderId}&display=full`,
            'order_histories',
            'order_history'
        );
        
        // On trie par date pour avoir un affichage chronologique
        return histories.sort((a, b) => new Date(a.date_add).getTime() - new Date(b.date_add).getTime());
    }
};
```

### B. Intégration Vue (`OrderTimeline.vue`)
```vue
<template>
    <ul class="timeline">
        <li v-for="step in timeline" :key="step.id" class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <!-- Utilisation de notre utilitaire de date ! -->
                <span class="date">{{ formatForDisplay(step.date_add) }}</span>
                <h4>{{ getStatusName(step.id_order_state) }}</h4>
            </div>
        </li>
    </ul>
</template>

<style>
/* CSS classique pour une Timeline avec une ligne verticale */
.timeline { border-left: 2px solid #ddd; padding-left: 20px; }
.timeline-marker { width: 10px; height: 10px; border-radius: 50%; background: #4CAF50; }
</style>
```

---

## 3. Module "Filtres à Facettes" (Recherche avancée)
**Pourquoi ?** Une simple barre de recherche textuelle ne suffit pas quand on a 50 produits. Les clients veulent filtrer par Catégorie, par Prix (min-max) et par Déclinaison (ex: "Taille XL").

### A. Logique Store (`useProductFilter.ts`)
```typescript
const filterState = ref({
    categoryId: null as number | null,
    maxPrice: 1000,
    searchQuery: ""
});

const filteredProducts = computed(() => {
    return allProducts.value.filter(p => {
        // Filtre par catégorie
        if (filterState.value.categoryId && p.id_category_default !== filterState.value.categoryId) return false;
        
        // Filtre par prix
        if (parseFloat(p.price) > filterState.value.maxPrice) return false;
        
        // Filtre textuel
        if (filterState.value.searchQuery) {
            const query = filterState.value.searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(query);
        }
        
        return true;
    });
});
```

### B. Vue (`SidebarFilters.vue`)
```vue
<template>
    <aside class="filters">
        <input type="text" v-model="filterState.searchQuery" placeholder="Chercher un produit..." />
        
        <h3>Prix Max : {{ filterState.maxPrice }} €</h3>
        <input type="range" min="0" max="1000" v-model="filterState.maxPrice" />
        
        <h3>Catégorie</h3>
        <select v-model="filterState.categoryId">
            <option :value="null">Toutes les catégories</option>
            <option v-for="cat in categories" :value="cat.id">{{ cat.name }}</option>
        </select>
    </aside>
</template>
```

---

## 4. Module "Wishlist / Favoris"
**Pourquoi ?** Améliore le taux de rétention. Le client sauvegarde un produit qu'il veut acheter plus tard. C'est très simple à faire car cela peut être géré 100% en local (ou via l'API client).

### A. Logique Locale (`wishlistStore.ts`)
```typescript
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useWishlistStore = defineStore('wishlist', () => {
    // Initialisation depuis le LocalStorage
    const savedIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const favoriteProductIds = ref<string[]>(savedIds);

    // Sauvegarde automatique à chaque changement
    watch(favoriteProductIds, (newIds) => {
        localStorage.setItem('wishlist', JSON.stringify(newIds));
    }, { deep: true });

    const toggleFavorite = (productId: string) => {
        const index = favoriteProductIds.value.indexOf(productId);
        if (index === -1) {
            favoriteProductIds.value.push(productId);
        } else {
            favoriteProductIds.value.splice(index, 1);
        }
    };

    const isFavorite = (productId: string) => favoriteProductIds.value.includes(productId);

    return { favoriteProductIds, toggleFavorite, isFavorite };
});
```

### B. Vue (`ProductCard.vue`)
```vue
<button @click="toggleFavorite(product.id)" class="heart-btn">
    <span v-if="isFavorite(product.id)">❤️</span>
    <span v-else>🤍</span>
</button>
```
