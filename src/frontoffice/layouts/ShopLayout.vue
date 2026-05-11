<template>
  <div class="shop-layout">
    <Navbar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue';
</script>

<style scoped>
.shop-layout {
  display: flex;
  flex-direction: column;
}
</style>
