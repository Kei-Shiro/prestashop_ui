<template>
  <div v-if="cartStore.isCartDrawerOpen" class="fixed inset-0 overflow-hidden z-50">
    <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="cartStore.closeCartDrawer"></div>
    <section class="absolute inset-y-0 right-0 pl-10 max-w-full flex">
      <div class="w-screen max-w-md">
        <div class="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
          <div class="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
            <div class="flex items-start justify-between">
              <h2 class="text-lg font-medium text-gray-900">Panier</h2>
              <div class="ml-3 h-7 flex items-center">
                <button @click="cartStore.closeCartDrawer" class="-m-2 p-2 text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Fermer</span>
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="mt-8">
              <div class="flow-root">
                <ul v-if="cartStore.items.length > 0" class="-my-6 divide-y divide-gray-200">
                  <li v-for="item in cartStore.items" :key="item.product.id_product" class="py-6 flex">
                    <div class="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                      <img :src="productImageUrl(item.product)" alt="Product" class="w-full h-full object-center object-cover">
                    </div>
                    <div class="ml-4 flex-1 flex flex-col">
                      <div>
                        <div class="flex justify-between text-base font-medium text-gray-900">
                          <h3>{{ item.product.name }}</h3>
                          <p class="ml-4">{{ formatPrice(item.product.price) }} €</p>
                        </div>
                      </div>
                      <div class="flex-1 flex items-end justify-between text-sm">
                        <div class="flex items-center border border-gray-300 rounded">
                          <button @click="cartStore.updateQuantity(item.product.id_product, item.quantity - 1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100">-</button>
                          <span class="px-2 py-1 text-gray-900">{{ item.quantity }}</span>
                          <button @click="cartStore.updateQuantity(item.product.id_product, item.quantity + 1)" class="px-2 py-1 text-gray-600 hover:bg-gray-100">+</button>
                        </div>
                        <div class="flex">
                          <button @click="cartStore.removeProduct(item.product.id_product)" type="button" class="font-medium text-purple-600 hover:text-purple-500">Supprimer</button>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
                <p v-else class="text-gray-500 text-center py-10">Votre panier est vide.</p>
              </div>
            </div>
          </div>

          <div v-if="cartStore.items.length > 0" class="border-t border-gray-200 py-6 px-4 sm:px-6">
            <div class="flex justify-between text-base font-medium text-gray-900">
              <p>Sous-total</p>
              <p>{{ cartStore.totalAmount.toFixed(2) }} €</p>
            </div>
            <p class="mt-0.5 text-sm text-gray-500">Frais de livraison gratuits. Paiement à la livraison.</p>
            <div class="mt-6">
              <button @click="goToCheckout" class="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700">
                Commander
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '../stores/cart';
import { useRouter } from 'vue-router';
import { useProduct } from '@shared/composables/useProduct';

const cartStore = useCartStore();
const router = useRouter();
const { getProductImageUrl } = useProduct();

const formatPrice = (price: string | number) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return p.toFixed(2);
}

const productImageUrl = (product: any) => {
  return getProductImageUrl(product, 'cart_default');
}

const goToCheckout = () => {
    cartStore.closeCartDrawer();
    router.push('/checkout');
}
</script>