<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <Navbar />
    <main class="flex-grow">
      <router-view />
    </main>
    <CartDrawer />
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue';
import CartDrawer from '../components/CartDrawer.vue';
</script>
