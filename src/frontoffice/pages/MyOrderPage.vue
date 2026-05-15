<template>
  <div class="orders-page">
    <h1 class="page-title">Mes commandes</h1>
    <div v-if="isLoading" class="state-msg">Chargement...</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="state-msg">Aucune commande trouvee.</div>
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-info">
          <p class="order-id">Commande n{{ order.id }}</p>
          <p class="order-date">{{ order.dateAdd }}</p>
          <p class="order-total">Total : {{ order.totalPaid }} &euro;</p>
        </div>
        <div class="order-status" :style="{ color: order.currentState.color }">
          {{ order.currentState.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOrders } from '@features/checkout/composables/useOrders';
import { useAuthStore } from '@features/auth/stores/customerAuthStore';

const { orders, isLoading, error, loadOrdersAndMetadata } = useOrders();
const authStore = useAuthStore();

onMounted(async () => {
  if (!authStore.isAnonymous && authStore.user) {
    await loadOrdersAndMetadata();
    const userId = Number(authStore.user.id);
    orders.value = orders.value.filter(o => Number(o.customerId) === userId);
  } else {
    orders.value = [];
  }
});
</script>

<style scoped>
.orders-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 64px 24px;
}
.page-title {
  font-family: Georgia, serif;
  font-size: 2rem;
  color: #0f172a;
  margin: 0 0 48px;
  letter-spacing: -0.02em;
}

/* States */
.state-msg {
  text-align: center;
  padding: 64px 0;
  color: #64748b;
  font-size: 0.9375rem;
}
.state-error {
  text-align: center;
  padding: 64px 0;
  color: #ef4444;
  font-size: 0.9375rem;
}

/* List */
.orders-list { display: flex; flex-direction: column; gap: 12px; }
.order-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 20px 24px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.order-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.order-info { display: flex; flex-direction: column; gap: 4px; }
.order-id { font-weight: 600; color: #0f172a; margin: 0; font-size: 0.9375rem; }
.order-date { font-size: 0.8125rem; color: #64748b; margin: 0; }
.order-total { font-size: 0.875rem; color: #0f172a; margin: 0; }
.order-status {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-align: right;
}

@media (max-width: 480px) {
  .order-card { flex-direction: column; align-items: flex-start; gap: 12px; }
  .order-status { text-align: left; }
}
</style>