<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Mes Commandes</h1>

    <div v-if="orderStore.isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <div v-else-if="orderStore.error" class="text-red-500 text-center py-10">
      {{ orderStore.error }}
    </div>

    <div v-else-if="orderStore.myOrders.length === 0" class="text-center py-10">
      <p class="text-gray-500">Vous n'avez passé aucune commande pour le moment.</p>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="order in orderStore.myOrders" :key="order.id">
          <div class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-purple-600 truncate">Commande {{ order.reference }}</p>
              <div class="ml-2 flex-shrink-0 flex">
                <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :style="{ backgroundColor: order.currentState?.color + '20', color: order.currentState?.color }">
                  {{ order.currentState?.label }}
                </p>
              </div>
            </div>
            <div class="mt-2 sm:flex sm:justify-between">
              <div class="sm:flex">
                <p class="flex items-center text-sm text-gray-500">
                  Total: {{ order.totalPaid }} €
                </p>
                <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                  Paiement: {{ order.payment }}
                </p>
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                <p>
                  Passée le <time :datetime="order.dateAdd">{{ order.dateAdd }}</time>
                </p>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCustomerOrderStore } from '../stores/order';

const orderStore = useCustomerOrderStore();

onMounted(() => {
    orderStore.fetchMyOrders();
});
</script>