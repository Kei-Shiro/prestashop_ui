<template>
  <div class="orders-page">
    <h1 class="page-title">Mes commandes</h1>
    <p v-if="orders.length > 0" class="page-subtitle">{{ orders.length }} commande{{ orders.length > 1 ? 's' : '' }} au total</p>
    <div v-if="isLoading" class="state-msg">Chargement...</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="state-msg">Aucune commande trouvee.</div>
    <div v-else class="orders-list">
      <div v-for="order in paginatedOrders" :key="order.id" class="order-card">
        <div class="order-info">
          <p class="order-id">Commande n{{ order.id }}</p>
          <p class="order-date">{{ order.dateAdd }}</p>
          <p class="order-total">Total : {{ order.totalPaid }} &euro;</p>
        </div>
        <div class="order-status" :style="{ color: order.currentState.color }">
          {{ order.currentState.label }}
        </div>
        <div>
          <input
              type="number"
              v-model.number="(order as any).multipli"
              @vue:mounted="(order as any).multipli = 1"
              min="1"
              class="input-quantity"
          />
          <button @click="reorder(order.id, (order as any).multipli)" class="btn-reorder">
            Acheter à nouveau
          </button>
        </div>
      </div>

      <BasePagination
        v-if="!isLoading && !error && orders.length > 0"
        v-model:current-page="currentPage"
        :total-items="orders.length"
        :items-per-page="itemsPerPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, reactive} from 'vue';
import { useOrders } from '@features/checkout/composables/useOrders';
import { useCustomerAuthStore as useAuthStore } from '@shared/models/auth';
import BasePagination from '@shared/ui/components/BasePagination.vue';
import { useRouter } from 'vue-router';

const { orders, isLoading, error, loadOrdersAndMetadata } = useOrders();
const authStore = useAuthStore();
const router = useRouter();

const reorder = (orderId: number, multipli: number) => {
  const finalMultiplier = multipli || 1;
  router.push({
    path: '/reorder',
    query: {
      orderId: orderId.toString(),
      multiplier: finalMultiplier.toString()
    }
  });
};

const currentPage = ref(1);
const itemsPerPage = 10;

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return orders.value.slice(start, start + itemsPerPage);
});

const commander = {

}




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
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}
.page-subtitle {
  font-family: sans-serif;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 40px;
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