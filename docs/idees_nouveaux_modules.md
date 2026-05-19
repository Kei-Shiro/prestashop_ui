# Idées de Nouveaux Modules & Intégration

Ce document détaille les 5 grands modules qui peuvent être ajoutés au projet PrestaShop UI pour le transformer en un ERP / Front-office complet. Pour chaque module, vous trouverez la logique d'implémentation et les snippets de code associés.

---

## 1. Module "Clients / CRM" (Customer Relationship Management)
**Objectif :** Permettre à l'administrateur de voir, chercher et analyser la base client depuis le Back-office.

### A. Service API (`customer-service.ts`)
Création d'un service dédié pour récupérer les clients de PrestaShop.
```typescript
import apiService from '@shared/api/api-service';

export const customerAdminService = {
    async getAllCustomers() {
        // display=full permet d'avoir toutes les infos (nom, email, date d'inscription)
        return await apiService.fetchList<any>('/customers?display=full', 'customers', 'customer');
    },
    
    async toggleCustomerStatus(customerId: number, currentStatus: number) {
        const newStatus = currentStatus === 1 ? 0 : 1;
        const payload = {
            customer: { id: customerId, active: newStatus }
        };
        await apiService.put(`/customers/${customerId}`, payload);
        return newStatus;
    }
};
```

### B. Vue Back-Office (`CustomersPage.vue`)
```vue
<template>
    <div class="customers-page">
        <h1>Gestion des Clients</h1>
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Nom</th><th>Email</th><th>Inscrit le</th><th>Statut</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="client in clients" :key="client.id">
                    <td>{{ client.id }}</td>
                    <td>{{ client.firstname }} {{ client.lastname }}</td>
                    <td>{{ client.email }}</td>
                    <td>{{ formatDate(client.date_add) }}</td>
                    <td>
                        <span :class="client.active == 1 ? 'text-green' : 'text-red'">
                            {{ client.active == 1 ? 'Actif' : 'Bloqué' }}
                        </span>
                    </td>
                    <td>
                        <button @click="toggleStatus(client)">
                            {{ client.active == 1 ? 'Bloquer' : 'Débloquer' }}
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
```

---

## 2. Module "Promotions & Bons de réduction" (Cart Rules)
**Objectif :** Permettre l'application de codes promo dans le panier en Front-office.

### A. Service API (`discount-service.ts`)
```typescript
export const discountService = {
    async getDiscountByCode(code: string) {
        // Recherche la règle panier correspondant au code saisi
        const rules = await apiService.fetchList<any>(`/cart_rules?filter[code]=${code}&display=full`, 'cart_rules', 'cart_rule');
        if (rules.length === 0) throw new Error("Code promo invalide");
        return rules[0];
    },
    
    async applyDiscountToCart(cartId: number, discountId: number) {
        // Ajoute la relation discount <-> panier
        // Nécessite souvent une mise à jour manuelle ou un appel spécifique selon la config PS
        // ou d'ajouter la réduction manuellement dans le store front-end avant création de la commande.
    }
};
```

### B. Store du Panier (`cartStore.ts`)
```typescript
const appliedDiscount = ref<any>(null);

const applyCode = async (code: string) => {
    try {
        const rule = await discountService.getDiscountByCode(code);
        appliedDiscount.value = rule;
        toast.success(`Code ${code} appliqué !`);
    } catch (e) {
        toast.error("Ce code n'existe pas ou a expiré.");
    }
};

const finalTotal = computed(() => {
    let total = totalAmount.value;
    if (appliedDiscount.value) {
        const reduction = parseFloat(appliedDiscount.value.reduction_amount);
        const percent = parseFloat(appliedDiscount.value.reduction_percent);
        
        if (reduction > 0) total -= reduction;
        if (percent > 0) total -= (total * (percent / 100));
    }
    return Math.max(0, total);
});
```

---

## 3. Module "Transporteurs" (Carriers Selection)
**Objectif :** Laisser le client choisir son mode de livraison avant de payer.

### A. Service API
```typescript
export const carrierService = {
    async getActiveCarriers() {
        return await apiService.fetchList<any>('/carriers?filter[active]=1&filter[deleted]=0&display=full', 'carriers', 'carrier');
    }
};
```

### B. Vue Front-Office (`CheckoutModal.vue`)
```vue
<template>
    <div class="carrier-selection">
        <h3>Choisissez votre livraison</h3>
        <div v-for="carrier in carriers" :key="carrier.id" class="carrier-option">
            <input type="radio" :value="carrier.id" v-model="selectedCarrierId" />
            <label>
                {{ carrier.name }} 
                <span class="delay">({{ carrier.delay }})</span>
            </label>
        </div>
        <button @click="confirmOrder(selectedCarrierId)">Valider ma commande</button>
    </div>
</template>
```

---

## 4. Module "SAV & Messagerie" (Customer Threads)
**Objectif :** Permettre aux clients d'envoyer un message concernant une commande précise.

### A. Service API (Message Creation)
```typescript
export const messageService = {
    async sendMessage(customerId: number, orderId: number, messageText: string) {
        const payload = {
            customer_message: {
                id_customer_thread: '', // PS créera le thread si vide
                message: messageText,
            }
        };
        // Attention : il faut d'abord créer un customer_thread si c'est le premier message
        // Puis lier le customer_message à ce thread.
        const threadPayload = {
            customer_thread: {
                id_customer: customerId,
                id_order: orderId,
                id_contact: 1, // Contact webmaster par défaut
                status: 'open',
                email: 'client@email.com'
            }
        };
        const thread = await apiService.post('/customer_threads', threadPayload);
        
        payload.customer_message.id_customer_thread = thread.prestashop.customer_thread.id;
        return await apiService.post('/customer_messages', payload);
    }
};
```

---

## 5. Module "Facturation & PDF" (Invoices)
**Objectif :** Télécharger la facture PDF générée par PrestaShop depuis l'UI Vue.js.

### A. Logique de téléchargement (JavaScript Blob)
```typescript
export const invoiceService = {
    async downloadInvoice(orderId: number) {
        try {
            // L'API PrestaShop permet souvent de requêter le PDF en modifiant le header Accept
            // ou via des endpoints spécifiques si activés (ex: /api/orders/{id}?display=full&io_format=pdf)
            const response = await apiService.axiosInstance.get(`/orders/${orderId}?io_format=pdf`, {
                responseType: 'blob' // TRÈS IMPORTANT pour les fichiers
            });
            
            // Création d'un lien invisible pour forcer le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Facture_Commande_${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Erreur lors du téléchargement de la facture", error);
        }
    }
};
```

### B. Intégration Vue
```vue
<button @click="downloadInvoice(order.id)" class="btn-download">
    📄 Télécharger la facture
</button>
```
