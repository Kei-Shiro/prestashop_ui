<template>
  <div class="container mx-auto px-4 py-8 text-center">
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
      <h2 class="text-2xl font-bold">Merci pour votre commande !</h2>
      <p>Votre numéro de commande : <strong>{{ orderId }}</strong></p>
    </div>
    <p>Un email de confirmation vous a été envoyé.</p>
    <router-link to="/orders" class="mt-4 inline-block text-blue-600 hover:underline">Voir mes commandes</router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const orderId = route.params.orderId;
</script>