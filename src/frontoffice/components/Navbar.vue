<template>
  <header 
    :class="[
      'fixed top-0 left-0 w-full z-50 transition-all duration-[1s] ease-editorial px-8 md:px-16 flex justify-between items-center',
      isScrolled ? 'liquid-glass py-4' : 'py-8 bg-transparent'
    ]"
  >
    <nav class="flex gap-10 items-center text-xs font-light tracking-[0.15em] uppercase hidden md:flex">
      <router-link to="/" class="link-underline">Collections</router-link>
      <a href="#" class="link-underline">Maison</a>
      <a href="#" class="link-underline">Journal</a>
    </nav>
    
    <router-link to="/" class="text-4xl md:text-5xl font-serif tracking-tighter hover:text-brand-accent transition-colors duration-700 ease-editorial absolute left-1/2 -translate-x-1/2">
      ADMIRABLE
    </router-link>

    <div class="flex gap-8 items-center text-xs font-light tracking-[0.15em] uppercase">
      <a href="#" class="link-underline hidden md:block">Recherche</a>
      <a href="#" class="link-underline">Panier (0)</a>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 80
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
</style>