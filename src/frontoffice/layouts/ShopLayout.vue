<template>
  <div class="shop-layout bg-brand-bg text-brand-text min-h-screen">
    <Navbar />
    <main>
      <router-view v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <div class="min-h-screen flex items-center justify-center font-serif text-2xl tracking-widest uppercase">Chargement...</div>
          </template>
        </Suspense>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '../components/Navbar.vue';
</script>

<style scoped>
/* Removed flex column styling to let Tailwind handle the layout organically */
</style>
