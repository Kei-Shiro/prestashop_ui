<template>
  <article class="group relative flex flex-col items-start cursor-pointer w-full">
    <!-- Image block -->
    <div :class="['w-[85%] aspect-[4/5] overflow-hidden bg-[#f0f0f0] mb-8 relative', isEven ? 'ml-auto mr-0' : 'mr-auto md:ml-0']">
      <!-- Fallback image if product image is not available -->
      <img :src="product.images?.[0] || 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop'" 
           :alt="product.name" 
           class="w-full h-full object-cover scale-[1.02] group-hover:scale-100 transition-transform duration-[1.5s] ease-editorial">
      
      <!-- Overlay & Bouton Animé -->
      <div class="absolute inset-0 bg-brand-text/10 opacity-0 group-hover:opacity-100 transition-opacity duration-[1s] ease-editorial flex items-center justify-center">
        <router-link :to="`/product/${product.id}`" class="bg-brand-bg text-brand-text px-10 py-5 font-sans text-[10px] uppercase tracking-[0.2em] transform translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-[1.2s] ease-editorial hover:bg-brand-accent hover:text-white delay-75">
          Découvrir
        </router-link>
      </div>
    </div>
    
    <!-- Détails -->
    <div :class="['w-full md:w-[85%] flex justify-between items-end', isEven ? 'ml-auto pl-12' : '']">
      <div>
        <p class="text-[10px] uppercase tracking-[0.2em] text-brand-text/40 mb-3 font-sans">{{ product.category || 'Collection' }}</p>
        <router-link :to="`/product/${product.id}`">
          <h3 class="font-serif text-3xl transition-colors duration-[0.8s] group-hover:text-brand-accent">{{ product.name }}</h3>
        </router-link>
      </div>
      <p class="font-sans text-xl font-light">{{ product.price }} €</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Product } from "@shared/types/product";

defineProps<{
  product: Product | any,
  isEven?: boolean
}>()
</script>

<style scoped>
/* Tailwind will handle styles, removing scoped CSS */
</style>