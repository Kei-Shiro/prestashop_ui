<template>
  <main>
    <!-- HERO SECTION : ASYMÉTRIE & ESPACE NÉGATIF -->
    <section class="relative min-h-screen flex items-center pt-32 pb-20 px-8 md:px-16">
      <div class="w-full max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        <!-- Typographie Imposante -->
        <div class="md:col-span-7 z-10 md:pr-12 mt-12 md:mt-0">
          <p class="font-sans text-[10px] uppercase tracking-[0.3em] text-brand-accent mb-8">Chapitre I — Essence</p>
          <h1 class="font-serif text-6xl md:text-[7.5rem] leading-[0.85] tracking-tight mb-10">
            La forme de <br>
            <span class="italic text-brand-text/80">l'invisible.</span>
          </h1>
          <p class="font-sans font-light text-brand-text/60 max-w-md text-lg leading-relaxed mb-16">
            Des pièces façonnées avec intention. Une esthétique épurée où chaque ligne a sa raison d'être, conçue pour un quotidien d'exception.
          </p>
          
          <a href="#collection" class="group inline-flex items-center gap-6 text-xs uppercase tracking-[0.2em] font-medium">
            <span class="link-underline pb-1">Explorer l'œuvre</span>
            <!-- Flèche animée fluide -->
            <svg class="w-6 h-6 transform group-hover:translate-x-3 transition-transform duration-[0.8s] ease-editorial text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="1.2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </a>
        </div>

        <!-- Image Flottante sans bordures -->
        <div class="md:col-span-5 relative">
          <div class="relative w-full aspect-[3/4] overflow-hidden ml-auto max-w-md">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
                 alt="Éditorial minimaliste" 
                 class="w-full h-full object-cover object-center scale-105 hover:scale-100 transition-transform duration-[2s] ease-editorial">
          </div>
        </div>

      </div>
    </section>

    <!-- PRODUITS : CARTES ASYMÉTRIQUES & INTERACTIONS -->
    <section id="collection" class="py-40 px-8 md:px-16 bg-white/30">
      <h2 class="font-serif text-4xl md:text-6xl mb-32 text-center tracking-tight">Pièces Choisies</h2>
      
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-24">
        <!-- Rendu dynamique des ProductCard avec asymétrie -->
        <ProductCard 
          v-for="(p, index) in products" 
          :key="p.id" 
          :product="p" 
          :is-even="index % 2 !== 0"
          :class="{'md:mt-48': index % 2 !== 0}" 
        />
      </div>
    </section>

    <!-- Newsletter Minimaliste -->
    <section class="py-40 px-8 md:px-16 border-t border-brand-text/5 mt-20">
      <div class="max-w-xl mx-auto text-center">
        <h3 class="font-serif text-4xl mb-12">Le Privilège du Silence</h3>
        <form class="flex flex-col md:flex-row gap-8 relative group items-end" @submit.prevent>
          <input type="email" placeholder="Votre adresse email" class="input-minimal w-full font-sans text-sm font-light placeholder:text-brand-text/30">
          <button type="submit" class="text-[10px] uppercase tracking-[0.2em] font-medium text-brand-text hover:text-brand-accent transition-colors duration-700 whitespace-nowrap pb-2">
            S'inscrire
          </button>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import ProductCard from '../components/ProductCard.vue';
import productService from "@shared/services/product-service";
import { Product } from "@shared/types/product";

// If using Suspense in the layout, await works here.
const products: Product[] = await productService.getAll();
</script>

<style scoped>
</style>