<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Validation de la commande</h1>

    <div v-if="checkoutStore.orderSuccess" class="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700 font-medium">
            Votre commande a été passée avec succès !
          </p>
          <div class="mt-4">
            <router-link to="/my-orders" class="text-sm font-medium text-green-700 hover:text-green-600 underline">Voir mes commandes</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="cartStore.items.length === 0" class="text-center py-10">
      <p class="text-gray-500 mb-4">Votre panier est vide.</p>
      <router-link to="/" class="text-purple-600 hover:text-purple-500 font-medium">Retourner à la boutique</router-link>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Récapitulatif</h3>
      </div>
      <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl class="sm:divide-y sm:divide-gray-200">
          <div v-for="item in cartStore.items" :key="item.product.id_product" class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">{{ item.quantity }}x {{ item.product.name }}</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">{{ (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price * item.quantity).toFixed(2) }} €</dd>
          </div>
          
          <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
            <dt class="text-sm font-medium text-gray-500">Frais de livraison</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">0.00 €</dd>
          </div>

          <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
            <dt class="text-base font-bold text-gray-900">Total à payer</dt>
            <dd class="mt-1 text-base font-bold text-gray-900 sm:mt-0 sm:col-span-2 text-right">{{ cartStore.totalAmount.toFixed(2) }} €</dd>
          </div>
        </dl>
      </div>
      
      <div class="px-4 py-5 sm:px-6 border-t border-gray-200">
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">Le paiement se fera <strong>uniquement à la livraison</strong>.</p>
            </div>
          </div>
        </div>

        <div v-if="checkoutStore.error" class="text-red-500 text-sm mb-4">{{ checkoutStore.error }}</div>

        <button @click="placeOrder" :disabled="checkoutStore.isProcessing" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
          <span v-if="checkoutStore.isProcessing">Traitement en cours...</span>
          <span v-else>Confirmer la commande</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCartStore } from '../stores/cart';
import { useCheckoutStore } from '../stores/checkout';

const cartStore = useCartStore();
const checkoutStore = useCheckoutStore();

onMounted(() => {
    checkoutStore.reset();
});

const placeOrder = async () => {
    await checkoutStore.placeOrder();
};
</script>