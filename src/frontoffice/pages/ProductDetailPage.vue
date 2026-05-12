<template>
  <div class="product-detail min-h-screen pt-32 pb-20 px-8 md:px-16">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-32">
      <!-- Visuels Produit (Gauche 60%) -->
      <div class="md:col-span-7 space-y-8">
        <div class="w-full aspect-[3/4] bg-[#f0f0f0] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop" 
               alt="Produit Image" 
               class="w-full h-full object-cover">
        </div>
        <!-- Espace pour d'autres images... -->
      </div>
      
      <!-- Informations Produit (Droite 40%, Sticky) -->
      <div class="md:col-span-5">
        <div class="sticky top-40">
          <p class="text-[10px] uppercase tracking-[0.2em] text-brand-text/40 mb-4 font-sans">Collection</p>
          <h1 class="font-serif text-5xl tracking-tight mb-6">Produit {{ $route.params.id }}</h1>
          <p class="font-sans text-2xl font-light mb-12">185 €</p>
          
          <button class="w-full border-b border-brand-accent text-left py-4 text-xs font-sans uppercase tracking-[0.2em] hover:bg-brand-bg hover:text-brand-accent transition-colors duration-[0.8s] ease-editorial mb-16 relative overflow-hidden group">
             <span class="relative z-10 group-hover:text-brand-text">Ajouter au panier</span>
             <div class="absolute bottom-0 left-0 w-full h-0 bg-brand-accent group-hover:h-full transition-all duration-[0.8s] ease-editorial z-0"></div>
          </button>
          
          <div class="space-y-6 text-sm font-light text-brand-text/80 leading-relaxed">
            <p>Une pièce d'exception conçue avec une attention méticuleuse portée aux détails. L'essence même du design utilitaire élevé au rang d'art.</p>
            <details class="group py-4 border-t border-brand-text/10 cursor-pointer">
              <summary class="text-xs uppercase tracking-[0.2em] font-medium list-none flex justify-between items-center">
                Matières
                <span class="group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div class="mt-4 text-brand-text/60">
                Composition exclusive sélectionnée pour sa durabilité et son esthétique pure.
              </div>
            </details>
            <details class="group py-4 border-t border-brand-text/10 cursor-pointer">
              <summary class="text-xs uppercase tracking-[0.2em] font-medium list-none flex justify-between items-center">
                Livraison
                <span class="group-open:rotate-45 transition-transform duration-300">+</span>
              </summary>
              <div class="mt-4 text-brand-text/60">
                Expédition avec soin sous 48h. Retours acceptés sous 30 jours.
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
/* Cache la flèche par défaut du <details> Safari/Chrome */
details > summary::-webkit-details-marker {
  display: none;
}
</style>