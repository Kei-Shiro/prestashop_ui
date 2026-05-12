<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Mon panier</h1>
    <div v-if="cart.items.length === 0" class="text-center py-12">
      <p>Votre panier est vide.</p>
      <router-link to="/shop" class="text-blue-600 hover:underline">Continuer vos achats</router-link>
    </div>
    <div v-else>
      <div class="divide-y">
        <div v-for="item in cart.items" :key="item.product.id_product" class="py-4 flex flex-wrap gap-4 items-center">
          <img :src="getImageUrl(item.product)" class="w-20 h-20 object-cover rounded" />
          <div class="flex-1">
            <h3 class="font-semibold">{{ item.product.name }}</h3>
            <p>{{ item.product.price }} €</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="updateQuantity(item.product.id_product, item.quantity - 1)" class="px-2 py-1 border rounded">-</button>
            <span class="w-8 text-center">{{ item.quantity }}</span>
            <button @click="updateQuantity(item.product.id_product, item.quantity + 1)" class="px-2 py-1 border rounded">+</button>
          </div>
          <p class="w-24 text-right">{{ item.total_price }} €</p>
          <button @click="removeItem(item.product.id_product)" class="text-red-500">Supprimer</button>
        </div>
      </div>
      <div class="mt-8 border-t pt-4 text-right">
        <p class="text-xl font-bold">Total : {{ cart.total_price }} €</p>
        <router-link to="/checkout" class="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Passer commande</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCart } from '@shared/composables/useCart';
import productService from '@shared/services/product-service';

const { cart, updateQuantity, removeItem } = useCart();

const getImageUrl = (product: any) => productService.getImageUrl(product.id_product, product.id_default_image, 'small_default');
</script>