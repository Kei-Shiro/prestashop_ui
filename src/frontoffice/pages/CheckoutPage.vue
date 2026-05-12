<template>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-8">Validation de commande</h1>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Si utilisateur anonyme, on demande les infos -->
      <div v-if="authStore.isAnonymous">
        <input v-model="form.firstname" type="text" placeholder="Prénom" required class="w-full border p-2 rounded" />
        <input v-model="form.lastname" type="text" placeholder="Nom" required class="w-full border p-2 rounded mt-2" />
        <input v-model="form.email" type="email" placeholder="Email" required class="w-full border p-2 rounded mt-2" />
        <input v-model="form.phone" type="tel" placeholder="Téléphone" required class="w-full border p-2 rounded mt-2" />
      </div>
      <!-- Si client connecté, on pré-remplit -->
      <div v-else>
        <p><strong>{{ authStore.user?.firstname }} {{ authStore.user?.lastname }}</strong> ({{ authStore.user?.email }})</p>
      </div>

      <input v-model="form.address" type="text" placeholder="Adresse" required class="w-full border p-2 rounded" />
      <div class="grid grid-cols-2 gap-4">
        <input v-model="form.city" type="text" placeholder="Ville" required class="border p-2 rounded" />
        <input v-model="form.postal_code" type="text" placeholder="Code postal" required class="border p-2 rounded" />
      </div>

      <div class="bg-gray-100 p-4 rounded">
        <h3 class="font-bold">Récapitulatif</h3>
        <p>Total : {{ cart.total_price }} €</p>
        <p>Paiement à la livraison</p>
      </div>

      <button type="submit" :disabled="loading" class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50">
        {{ loading ? 'Commande en cours...' : 'Confirmer la commande' }}
      </button>
      <p v-if="error" class="text-red-500">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCart } from '@shared/composables/useCart';
import { useCheckout } from '@shared/composables/useCheckout';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const { cart } = useCart();
const { submitOrder, loading, error } = useCheckout();

const form = reactive({
  firstname: authStore.user?.firstname || '',
  lastname: authStore.user?.lastname || '',
  email: authStore.user?.email || '',
  phone: '',
  address: '',
  city: '',
  postal_code: ''
});

const handleSubmit = async () => {
  try {
    const orderId = await submitOrder(form);
    router.push(`/order-confirmation/${orderId}`);
  } catch (e) {
    // error already set in useCheckout
  }
};
</script>