# Consolidation & Confort d'utilisation

Ce document fournit le code **prêt à l'emploi (copier-coller)** pour consolider les fonctionnalités de base de votre boutique. Les snippets sont écrits en tenant compte de l'architecture existante de votre projet (Pinia, Vue 3 Composition API, et vos utilitaires).

---

## 1. Filtres des commandes en Back-Office

**Objectif :** Permettre à l'administrateur de rechercher une commande par sa référence, ou de filtrer par statut (ex: Afficher uniquement les commandes "En attente").

### A. La logique (Dans votre `adminOrderStore.ts` ou composable)
Ajoutez ces variables et cette propriété calculée (`computed`) dans votre store qui gère les commandes admin.

```typescript
// 1. Ajoutez ces imports si manquants
import { ref, computed } from 'vue';

// 2. Variables réactives pour les filtres
const filterReference = ref<string>('');
const filterStatusId = ref<number | null>(null);

// 3. Propriété calculée pour la liste filtrée
const filteredAdminOrders = computed(() => {
    return adminOrders.value.filter(order => {
        // Filtre par référence (insensible à la casse)
        if (filterReference.value) {
            const searchLower = filterReference.value.toLowerCase();
            const refLower = order.reference.toLowerCase();
            if (!refLower.includes(searchLower)) return false;
        }
        
        // Filtre par statut exact
        if (filterStatusId.value && order.currentState.id !== filterStatusId.value) {
            return false;
        }
        
        return true; // La commande passe tous les filtres
    });
});

// N'oubliez pas de les retourner à la fin de votre store :
// return { filterReference, filterStatusId, filteredAdminOrders, ... }
```

### B. L'interface (`OrdersPage.vue`)
Placez cette barre de filtres juste au-dessus de votre balise `<table>` existante.

```vue
<!-- Barre de filtres -->
<div class="filters-bar" style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
    <input 
        type="text" 
        v-model="orderStore.filterReference" 
        placeholder="🔍 Chercher une référence (ex: XUZ...)" 
        style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
    />

    <select v-model="orderStore.filterStatusId" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
        <option :value="null">Tous les statuts</option>
        <option v-for="state in orderStore.orderStates" :key="state.id" :value="state.id">
            {{ state.label }}
        </option>
    </select>
    
    <button @click="orderStore.filterReference = ''; orderStore.filterStatusId = null" style="padding: 8px; cursor: pointer;">
        Réinitialiser
    </button>
</div>

<!-- Rappel : Dans votre tableau, utilisez la liste filtrée (v-for="order in orderStore.filteredAdminOrders") -->
```

---

## 2. Export des commandes en Back-Office (CSV)

**Objectif :** Télécharger la liste des commandes actuelles (ou filtrées) en fichier Excel/CSV pour la comptabilité.

### A. L'utilitaire d'Export (`src/shared/utils/exportUtils.ts`)
Créez ce fichier. Il utilise un "BOM" (`\uFEFF`) pour garantir que Microsoft Excel lise correctement les accents français.

```typescript
export function exportOrdersToCSV(orders: any[], filename: string = 'export_commandes') {
    if (!orders || orders.length === 0) {
        alert("Aucune commande à exporter.");
        return;
    }

    // 1. Définition des entêtes
    const headers = ["ID", "Référence", "Client", "Total Payé", "Paiement", "Statut", "Date"];
    
    // 2. Formatage des lignes
    const rows = orders.map(order => [
        order.id,
        order.reference,
        order.customerName || '',
        order.totalPaid.replace('.', ','), // Virgule pour Excel FR
        order.payment,
        order.currentState?.label || '',
        order.dateAdd
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(';')); // Séparateur point-virgule pour Excel FR

    // 3. Assemblage avec BOM pour UTF-8
    const csvContent = "\uFEFF" + headers.join(';') + "\n" + rows.join('\n');
    
    // 4. Déclenchement du téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
```

### B. Le bouton dans `OrdersPage.vue`
```vue
<script setup>
import { exportOrdersToCSV } from '@shared/utils/exportUtils';
// ...
</script>

<template>
    <!-- Ajoutez ce bouton à côté de vos filtres -->
    <button 
        @click="exportOrdersToCSV(orderStore.filteredAdminOrders, 'Commandes')"
        style="background: #28a745; color: white; padding: 8px 15px; border: none; border-radius: 4px; cursor: pointer;"
    >
        📥 Exporter en CSV
    </button>
</template>
```

---

## 3. Page de suivi de commande propre (Front-Office)

**Objectif :** Le client clique sur sa commande et voit une frise chronologique détaillée de l'avancement.

### A. Récupération API (`order-history-service.ts`)
Créez ce petit service ou ajoutez-le dans `order-service.ts`.
```typescript
import apiService from '@shared/api/api-service';
import { ensureArray } from '@shared/utils/arrayUtils';

export const getOrderTimeline = async (orderId: number) => {
    const res: any = await apiService.get(`/order_histories?filter[id_order]=${orderId}&display=full`);
    const histories = ensureArray(res?.prestashop?.order_histories?.order_history);
    
    // Trier du plus ancien au plus récent
    return histories.sort((a, b) => new Date(a.date_add).getTime() - new Date(b.date_add).getTime());
};
```

### B. Le Composant d'affichage (`OrderTracking.vue`)
Ce composant autonome peut être inséré dans le détail de la commande côté client.

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getOrderTimeline } from '@features/checkout/services/order-service'; // Adaptez le chemin
import { formatForDisplay } from '@shared/utils/dateUtils';
import { useCustomerOrderStore } from '@features/checkout/stores/customerOrderStore'; // Pour récupérer les noms des statuts

const props = defineProps<{ orderId: number }>();
const timeline = ref<any[]>([]);
const isLoading = ref(true);
const orderStore = useCustomerOrderStore();

onMounted(async () => {
    timeline.value = await getOrderTimeline(props.orderId);
    isLoading.value = false;
});

// Helper pour trouver le nom du statut (vous devez avoir un map des statuts dans le store)
const getStatusLabel = (stateId: string) => {
    // Si votre store expose un moyen de lire le nom du statut via l'id, utilisez-le. 
    // Sinon, affichez un statut générique ou faites un appel API pour les order_states.
    return `Statut ID: ${stateId}`; 
};
</script>

<template>
    <div class="tracking-container">
        <h3>Suivi de la commande #{{ orderId }}</h3>
        <p v-if="isLoading">Chargement du suivi...</p>
        
        <ul v-else class="timeline">
            <li v-for="(step, index) in timeline" :key="index" class="timeline-item">
                <div class="timeline-marker" :class="{ 'last-marker': index === timeline.length - 1 }"></div>
                <div class="timeline-content">
                    <span class="timeline-date">{{ formatForDisplay(step.date_add) }}</span>
                    <!-- Remplacez ceci par le vrai nom du statut -->
                    <h4 class="timeline-status">{{ getStatusLabel(step.id_order_state) }}</h4>
                </div>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.tracking-container { padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.timeline { list-style: none; padding: 0; margin: 0; border-left: 3px solid #e0e0e0; margin-left: 20px; }
.timeline-item { position: relative; padding-left: 25px; margin-bottom: 25px; }
.timeline-item:last-child { margin-bottom: 0; }
.timeline-marker { position: absolute; left: -9px; top: 0; width: 15px; height: 15px; border-radius: 50%; background: #bdbdbd; border: 3px solid #fff; }
.timeline-marker.last-marker { background: #28a745; /* Le statut actuel (le dernier) est vert */ box-shadow: 0 0 0 3px rgba(40,167,69,0.2); }
.timeline-date { font-size: 0.85rem; color: #666; display: block; margin-bottom: 4px; }
.timeline-status { margin: 0; font-size: 1rem; color: #333; font-weight: 600; }
</style>
```

---

## 4. Alertes de stock bas (Front-Office)

**Objectif :** Créer un sentiment d'urgence (FOMO) sur la fiche produit pour inciter à l'achat immédiat lorsque le stock est faible.

### L'intégration (Dans `ProductDetailPage.vue`)
Ce code se base sur la variable `currentCombinationStock` (ou équivalent) qui stocke la quantité disponible pour la déclinaison sélectionnée.

```vue
<script setup>
import { computed } from 'vue';

// On imagine que currentStock est la variable réactive contenant la quantité dispo
// ex: const currentStock = computed(() => productStore.getCombinationStock(productId, combinationId));

// On définit une alerte si le stock est strictement positif mais inférieur ou égal à 5
const isLowStock = computed(() => {
    return currentStock.value > 0 && currentStock.value <= 5;
});
</script>

<template>
    <!-- ... votre code HTML ... -->
    
    <!-- Bloc Alerte Stock (À placer juste au-dessus du bouton "Ajouter au panier") -->
    <div v-if="isLowStock" class="low-stock-alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span>
            <strong>Faites vite !</strong> Il ne reste plus que <strong>{{ currentStock }} exemplaire(s)</strong> en stock.
        </span>
    </div>
    
    <div v-else-if="currentStock === 0" class="out-of-stock-alert">
        Produit actuellement indisponible
    </div>
</template>

<style scoped>
.low-stock-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #fff3cd;
    color: #856404;
    padding: 12px 16px;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
    margin: 15px 0;
    font-size: 0.95rem;
    animation: pulse 2s infinite;
}

.low-stock-alert svg { flex-shrink: 0; color: #ffc107; }

.out-of-stock-alert {
    background-color: #f8d7da;
    color: #721c24;
    padding: 12px 16px;
    border-radius: 6px;
    margin: 15px 0;
    text-align: center;
    font-weight: bold;
}

/* Petite animation pour attirer l'oeil discrètement */
@keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(255, 193, 7, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
}
</style>
```
