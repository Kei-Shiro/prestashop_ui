<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Mes commandes</h1>
    <div v-if="isLoading" class="text-center">Chargement...</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="text-center">Aucune commande trouvée.</div>
    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id" class="border rounded p-4 flex justify-between items-center">
        <div>
          <p><strong>Commande n°{{ order.id }}</strong> - {{ order.dateAdd }}</p>
          <p>Total : {{ order.totalPaid }} €</p>
          <p>Statut : <span :style="{ color: order.currentState.color }">{{ order.currentState.label }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOrders } from '@shared/composables/useOrders';
import { useAuthStore } from '../stores/auth';

const { orders, isLoading, error, loadOrdersAndMetadata } = useOrders();
const authStore = useAuthStore();

onMounted(async () => {
  if (!authStore.isAnonymous && authStore.user) {
    // Modifier useOrders pour ne charger que les commandes du client connecté
    // Pour simplifier, on peut filtrer dans loadOrdersAndMetadata selon le customerId
    await loadOrdersAndMetadata(authStore.user.id);
  } else {
    // Anonyme n'a pas de commandes
    orders.value = [];
  }
});
</script>