<template>
  <div>
    <header class="bg-gray-800 text-white p-4">
      <div class="container mx-auto flex justify-between items-center">
        <router-link to="/" class="text-xl font-bold">Ma Boutique</router-link>
        <div class="space-x-4">
          <router-link to="/cart" class="hover:underline">Panier ({{ cart.total_quantity }})</router-link>
          <router-link v-if="authStore.isAuthenticated" to="/orders" class="hover:underline">Mes commandes</router-link>
          <button v-if="authStore.isAuthenticated" @click="logout" class="hover:underline">Déconnexion</button>
        </div>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCart } from '@shared/composables/useCart';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const cart = useCart();
const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>