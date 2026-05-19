# Idées de Fonctionnalités & Snippets d'Intégration

Ce document recense les petites fonctionnalités (1h à 2h d'implémentation) qui peuvent grandement améliorer le projet PrestaShop UI, avec les explications et le code de base pour les intégrer rapidement.

---

## 1. Changement de Statut de Commandes en Masse (Back-Office)
**Où ?** `OrdersPage.vue` / `useOrders.ts` / `order-service.ts`
**Pourquoi ?** Permet d'éviter de cliquer sur chaque commande une par une.

### Service (`order-service.ts`)
```typescript
async updateMultipleOrderStatuses(orderIds: number[], newStateId: number): Promise<void> {
    // Utilisation de Promise.all pour paralléliser les appels
    await Promise.all(orderIds.map(id => this.updateOrderStatus(id, newStateId)));
}
```

### Store / Composable (`useOrders.ts`)
```typescript
const selectedOrders = ref<number[]>([]);
const isMassUpdating = ref(false);

const changeMultipleStatuses = async (newStateId: number) => {
    isMassUpdating.value = true;
    try {
        await orderService.updateMultipleOrderStatuses(selectedOrders.value, newStateId);
        // Mise à jour optimiste
        const newState = orderStates.value.find(s => s.id === newStateId);
        orders.value.forEach(o => {
            if (selectedOrders.value.includes(o.id) && newState) {
                o.currentState = { ...newState };
            }
        });
        selectedOrders.value = []; // Reset de la sélection
    } finally {
        isMassUpdating.value = false;
    }
};
```

### Vue (`OrdersPage.vue`)
```vue
<!-- En-tête : Action de masse -->
<div v-if="selectedOrders.length > 0" class="mass-action-bar">
    <span>{{ selectedOrders.length }} sélectionnée(s)</span>
    <select v-model="selectedState">
        <option v-for="state in allowedStateIds" :value="state">Changer en...</option>
    </select>
    <button @click="changeMultipleStatuses(selectedState)">Appliquer</button>
</div>

<!-- Ligne du tableau -->
<input type="checkbox" :value="order.id" v-model="selectedOrders" />
```

---

## 2. Top 5 des Produits les Plus Vendus (Dashboard)
**Où ?** `DashboardPage.vue` / `statsStore.ts`
**Pourquoi ?** Mieux comprendre ce qui génère du chiffre d'affaires.

### Logique d'agrégation (`statsStore.ts`)
```typescript
const getTopProducts = computed(() => {
    const productSales = new Map<string, { name: string, qty: number, total: number }>();
    
    // orders = liste de toutes les commandes avec leurs lignes
    orders.value.forEach(order => {
        order.associations?.order_rows?.order_row?.forEach((row: any) => {
            const id = row.product_id;
            const current = productSales.get(id) || { name: row.product_name, qty: 0, total: 0 };
            current.qty += Number(row.product_quantity);
            current.total += (Number(row.unit_price_tax_incl) * Number(row.product_quantity));
            productSales.set(id, current);
        });
    });

    return Array.from(productSales.values())
        .sort((a, b) => b.qty - a.qty) // Tri par quantité
        .slice(0, 5); // Prendre les 5 premiers
});
```

---

## 3. Bouton "Re-commander" (Front-Office)
**Où ?** `customerOrderStore.ts` / `cartStore.ts`
**Pourquoi ?** Faciliter les achats récurrents.

### Intégration Vue
```vue
<button @click="reorder(order.id)" class="btn-reorder">Acheter à nouveau</button>
```

### Logique (`cartStore.ts`)
```typescript
const reorder = async (orderId: number) => {
    const orderDetails = await orderService.getOrderDetails(orderId);
    const rows = orderDetails.associations?.order_rows?.order_row;
    
    // Parcourir les lignes et ajouter au panier
    for (const row of rows) {
        await cartStore.addProduct(
            row.product_id, 
            row.product_quantity, 
            row.product_attribute_id
        );
    }
    toast.success("Produits ajoutés au panier !");
};
```

---

## 4. Jauge "Livraison Gratuite" (Front-Office Panier)
**Où ?** `CartDrawer.vue` ou `cartStore.ts`
**Pourquoi ?** Inciter à ajouter plus de produits.

### Calcul (Computed Property)
```typescript
const FREE_SHIPPING_THRESHOLD = 100;

const shippingProgress = computed(() => {
    const total = cartStore.totalAmount;
    if (total >= FREE_SHIPPING_THRESHOLD) return 100;
    return (total / FREE_SHIPPING_THRESHOLD) * 100;
});

const remainingForFreeShipping = computed(() => {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - cartStore.totalAmount);
});
```

### Affichage (Vue)
```vue
<div class="shipping-bar-container">
    <p v-if="remainingForFreeShipping > 0">
        Plus que {{ remainingForFreeShipping }} € pour la livraison gratuite !
    </p>
    <p v-else>🎉 Livraison gratuite débloquée !</p>
    <div class="progress-bar">
        <div class="progress" :style="{ width: shippingProgress + '%' }"></div>
    </div>
</div>
```

---

## 5. Indicateur "FOMO" de Stock (Front-Office Produit)
**Où ?** `ProductDetailPage.vue`
**Pourquoi ?** Créer un sentiment d'urgence.

### Logique
```typescript
const isLowStock = computed(() => {
    return currentCombinationStock.value > 0 && currentCombinationStock.value <= 5;
});
```

### Vue
```vue
<div v-if="isLowStock" class="fomo-alert">
    🔥 Faites vite, il n'en reste plus que {{ currentCombinationStock }} en stock !
</div>
<div v-else-if="currentCombinationStock === 0" class="out-of-stock">
    Ruputure de stock
</div>
```

---

## 6. Export CSV des Tableaux (Back-Office)
**Où ?** N'importe quel composant de tableau (Ex: `StockStatsTable.vue`).
**Pourquoi ?** Transmettre les données à la comptabilité.

### Logique pure Javascript (Sans librairie)
```typescript
const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
```
*Utilisation :* `<button @click="exportToCSV(stocks, 'etat_des_stocks')">Exporter</button>`

---

## 7. Badges "Nouveau" (Catalogue)
**Où ?** `ProductCard.vue`
**Pourquoi ?** Attirer l'oeil sur les nouveautés.

### Logique de date
```typescript
const isNew = computed(() => {
    if (!product.date_add) return false;
    const addedDate = new Date(product.date_add);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - addedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30; // Considéré comme nouveau si ajouté il y a moins de 30 jours
});
```

### Vue
```vue
<div class="product-card">
    <span v-if="isNew" class="badge-new">Nouveau</span>
    <!-- Image et détails du produit -->
</div>
```

---

## 8. Mode Sombre (Dark Mode)
**Où ?** `App.vue` et `index.css`
**Pourquoi ?** Confort visuel très demandé.

### Vue & State
```typescript
import { ref, watchEffect } from 'vue';

const isDarkMode = ref(localStorage.getItem('theme') === 'dark');

watchEffect(() => {
    if (isDarkMode.value) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
});
```

### Vanilla CSS
```css
:root {
    --bg-color: #ffffff;
    --text-color: #333333;
}

body.dark-theme {
    --bg-color: #121212;
    --text-color: #e0e0e0;
}

/* Application aux éléments */
body {
    background-color: var(--bg-color);
    color: var(--text-color);
    transition: background-color 0.3s ease;
}
```
