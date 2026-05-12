# FrontOffice E-commerce Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a clean, modern e-commerce FrontOffice with products display, cart management, simplified checkout, and order history.

**Architecture:** We will implement two Pinia stores (`useCartStore`, `useCheckoutStore`), UI components (`Navbar`, `ProductCard`, `CartDrawer`), and 4 main pages mapped in `vue-router`.

**Tech Stack:** Vue 3, Tailwind CSS, Pinia, vue-router.

---

### Task 1: Update Cart Store

**Files:**
- Modify: `src/frontoffice/stores/cart.ts`

- [ ] **Step 1: Write implementation for `useCartStore`**

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@shared/types/product';
import type { CartItem } from '@shared/types/cart';

export const useCartStore = defineStore('cart', () => {
    const items = ref<CartItem[]>([]);

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => {
            const price = typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price;
            return total + (price * item.quantity);
        }, 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    const isCartDrawerOpen = ref(false);
    function toggleCartDrawer() {
        isCartDrawerOpen.value = !isCartDrawerOpen.value;
    }
    function openCartDrawer() {
        isCartDrawerOpen.value = true;
    }
    function closeCartDrawer() {
        isCartDrawerOpen.value = false;
    }

    function addProduct(product: Product, quantity: number = 1) {
        const existingItem = items.value.find(item => item.product.id_product === product.id_product);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
            items.value.push({ product, quantity, total_price: price * quantity });
        }
        openCartDrawer();
    }

    function updateQuantity(productId: string | number, quantity: number) {
        const existingItem = items.value.find(item => item.product.id_product === String(productId));
        if (existingItem) {
            if (quantity <= 0) {
                removeProduct(productId);
            } else {
                existingItem.quantity = quantity;
            }
        }
    }

    function removeProduct(productId: string | number) {
        items.value = items.value.filter(item => item.product.id_product !== String(productId));
    }

    function clearCart() {
        items.value = [];
    }

    return {
        items,
        totalAmount,
        totalItems,
        isCartDrawerOpen,
        toggleCartDrawer,
        openCartDrawer,
        closeCartDrawer,
        addProduct,
        updateQuantity,
        removeProduct,
        clearCart
    };
});
```

- [ ] **Step 2: Commit**

```bash
git add src/frontoffice/stores/cart.ts
git commit -m "feat: update cart store with drawer state and items count"
```

---

### Task 2: Create Checkout Store

**Files:**
- Create: `src/frontoffice/stores/checkout.ts`

- [ ] **Step 1: Write minimal implementation**

```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { orderService } from '@shared/services/order-service';
import { useCartStore } from './cart';

export const useCheckoutStore = defineStore('checkout', () => {
    const isProcessing = ref(false);
    const error = ref<string | null>(null);
    const orderSuccess = ref(false);

    // Hardcode customerId to 1 for evaluation
    const customerId = 1;

    async function placeOrder() {
        const cartStore = useCartStore();
        if (cartStore.items.length === 0) return false;

        isProcessing.value = true;
        error.value = null;
        orderSuccess.value = false;

        try {
            const itemsForApi = cartStore.items.map(item => ({
                productId: Number(item.product.id_product),
                quantity: item.quantity
            }));

            // 1. Create a Cart in backend
            const cartId = await orderService.createCart(customerId, itemsForApi);
            // 2. Create the Order in backend
            await orderService.createOrder(customerId, cartId, cartStore.totalAmount);
            
            cartStore.clearCart();
            orderSuccess.value = true;
            return true;
        } catch (err: any) {
            console.error(err);
            error.value = "Erreur lors de la validation de la commande.";
            return false;
        } finally {
            isProcessing.value = false;
        }
    }

    function reset() {
        isProcessing.value = false;
        error.value = null;
        orderSuccess.value = false;
    }

    return {
        isProcessing,
        error,
        orderSuccess,
        placeOrder,
        reset
    };
});
```

- [ ] **Step 2: Commit**

```bash
git add src/frontoffice/stores/checkout.ts
git commit -m "feat: create checkout store"
```

---

### Task 3: Create UI Components - Navbar and CartDrawer

**Files:**
- Create: `src/frontoffice/components/Navbar.vue`
- Create: `src/frontoffice/components/CartDrawer.vue`

- [ ] **Step 1: Implement `Navbar.vue`**

```vue
<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <router-link to="/" class="flex-shrink-0 flex items-center">
            <span class="font-bold text-xl text-gray-900 tracking-tight">PrestaShop<span class="text-purple-600">UI</span></span>
          </router-link>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <router-link to="/" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" active-class="border-purple-500 text-gray-900">
              Accueil
            </router-link>
            <router-link to="/my-orders" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" active-class="border-purple-500 text-gray-900">
              Mes Commandes
            </router-link>
          </div>
        </div>
        <div class="flex items-center">
          <button @click="cartStore.toggleCartDrawer" class="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none">
            <span class="sr-only">Panier</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.totalItems > 0" class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-purple-600 rounded-full">{{ cartStore.totalItems }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useCartStore } from '../stores/cart';
const cartStore = useCartStore();
</script>
```

- [ ] **Step 2: Implement `CartDrawer.vue`**

```vue
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
```

- [ ] **Step 3: Commit**

```bash
git add src/frontoffice/components/Navbar.vue src/frontoffice/components/CartDrawer.vue
git commit -m "feat: add Navbar and CartDrawer components"
```

---

### Task 4: Create UI Component - ProductCard

**Files:**
- Create: `src/frontoffice/components/ProductCard.vue`

- [ ] **Step 1: Implement `ProductCard.vue`**

```vue
<template>
  <div class="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
    <div class="aspect-w-3 aspect-h-4 bg-gray-200 group-hover:opacity-75 sm:aspect-none sm:h-96">
      <img :src="imageUrl" :alt="product.name" class="w-full h-full object-center object-cover sm:w-full sm:h-full cursor-pointer" @click="goToProduct">
    </div>
    <div class="flex-1 p-4 space-y-2 flex flex-col">
      <h3 class="text-sm font-medium text-gray-900 cursor-pointer" @click="goToProduct">
        {{ product.name }}
      </h3>
      <p class="text-sm text-gray-500 line-clamp-2" v-html="product.description_short"></p>
      <div class="flex-1 flex flex-col justify-end">
        <p class="text-base font-medium text-gray-900 mb-4">{{ formatPrice(product.price) }} €</p>
        <button @click="addToCart" class="w-full bg-white border border-purple-600 rounded-md py-2 px-4 flex items-center justify-center text-sm font-medium text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
          Ajouter au panier
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import type { Product } from '@shared/types/product';
import { useProduct } from '@shared/composables/useProduct';

const props = defineProps<{
  product: Product
}>();

const router = useRouter();
const cartStore = useCartStore();
const { getProductImageUrl } = useProduct();

const imageUrl = computed(() => getProductImageUrl(props.product, 'home_default'));

const formatPrice = (price: string | number) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return p.toFixed(2);
}

const goToProduct = () => {
  router.push(`/product/${props.product.id_product}`);
};

const addToCart = () => {
  cartStore.addProduct(props.product, 1);
};
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/frontoffice/components/ProductCard.vue
git commit -m "feat: add ProductCard component"
```

---

### Task 5: Create HomePage and ProductDetailPage

**Files:**
- Create: `src/frontoffice/pages/HomePage.vue`
- Create: `src/frontoffice/pages/ProductDetailPage.vue`

- [ ] **Step 1: Implement `HomePage.vue`**

```vue
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-gray-900">Notre Collection</h1>
      <p class="mt-2 text-sm text-gray-500">Découvrez nos derniers produits ajoutés à la boutique.</p>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      <ProductCard v-for="product in products" :key="product.id_product" :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useProduct } from '@shared/composables/useProduct';
import ProductCard from '../components/ProductCard.vue';

const { products, loading, error, fetchProducts } = useProduct();

onMounted(() => {
  fetchProducts();
});
</script>
```

- [ ] **Step 2: Implement `ProductDetailPage.vue`**

```vue
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <div v-else-if="currentProduct" class="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
      <!-- Image gallery -->
      <div class="flex flex-col-reverse">
        <div class="w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
          <img :src="imageUrl" :alt="currentProduct.name" class="w-full h-full object-center object-cover">
        </div>
      </div>

      <!-- Product info -->
      <div class="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
        <h1 class="text-3xl font-extrabold tracking-tight text-gray-900">{{ currentProduct.name }}</h1>
        
        <div class="mt-3">
          <h2 class="sr-only">Product information</h2>
          <p class="text-3xl text-gray-900">{{ formatPrice(currentProduct.price) }} €</p>
        </div>

        <div class="mt-6">
          <h3 class="sr-only">Description</h3>
          <div class="text-base text-gray-700 space-y-6" v-html="currentProduct.description"></div>
        </div>

        <form class="mt-6" @submit.prevent="addToCart">
          <div class="mt-4 flex sm:flex-col1">
            <button type="submit" class="max-w-xs flex-1 bg-purple-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-purple-500 sm:w-full">
              Ajouter au panier
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProduct } from '@shared/composables/useProduct';
import { useCartStore } from '../stores/cart';

const route = useRoute();
const cartStore = useCartStore();
const { currentProduct, loading, error, fetchProduct, getProductImageUrl } = useProduct();

const imageUrl = computed(() => {
  if (!currentProduct.value) return '';
  return getProductImageUrl(currentProduct.value, 'large_default');
});

const formatPrice = (price: string | number) => {
    const p = typeof price === 'string' ? parseFloat(price) : price;
    return p.toFixed(2);
}

const addToCart = () => {
  if (currentProduct.value) {
    cartStore.addProduct(currentProduct.value, 1);
  }
};

onMounted(() => {
  const id = Number(route.params.id);
  if (id) {
    fetchProduct(id);
  }
});
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/frontoffice/pages/HomePage.vue src/frontoffice/pages/ProductDetailPage.vue
git commit -m "feat: add HomePage and ProductDetailPage"
```

---

### Task 6: Create CheckoutPage and MyOrdersPage

**Files:**
- Create: `src/frontoffice/pages/CheckoutPage.vue`
- Create: `src/frontoffice/pages/MyOrdersPage.vue`

- [ ] **Step 1: Implement `CheckoutPage.vue`**

```vue
<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Validation de la commande</h1>

    <div v-if="checkoutStore.orderSuccess" class="bg-green-50 border-l-4 border-green-400 p-4 mb-8">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700 font-medium">
            Votre commande a été passée avec succès !
          </p>
          <div class="mt-4">
            <router-link to="/my-orders" class="text-sm font-medium text-green-700 hover:text-green-600 underline">Voir mes commandes</router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="cartStore.items.length === 0" class="text-center py-10">
      <p class="text-gray-500 mb-4">Votre panier est vide.</p>
      <router-link to="/" class="text-purple-600 hover:text-purple-500 font-medium">Retourner à la boutique</router-link>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">Récapitulatif</h3>
      </div>
      <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl class="sm:divide-y sm:divide-gray-200">
          <div v-for="item in cartStore.items" :key="item.product.id_product" class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">{{ item.quantity }}x {{ item.product.name }}</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">{{ (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price * item.quantity).toFixed(2) }} €</dd>
          </div>
          
          <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
            <dt class="text-sm font-medium text-gray-500">Frais de livraison</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">0.00 €</dd>
          </div>

          <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
            <dt class="text-base font-bold text-gray-900">Total à payer</dt>
            <dd class="mt-1 text-base font-bold text-gray-900 sm:mt-0 sm:col-span-2 text-right">{{ cartStore.totalAmount.toFixed(2) }} €</dd>
          </div>
        </dl>
      </div>
      
      <div class="px-4 py-5 sm:px-6 border-t border-gray-200">
        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-blue-700">Le paiement se fera <strong>uniquement à la livraison</strong>.</p>
            </div>
          </div>
        </div>

        <div v-if="checkoutStore.error" class="text-red-500 text-sm mb-4">{{ checkoutStore.error }}</div>

        <button @click="placeOrder" :disabled="checkoutStore.isProcessing" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
          <span v-if="checkoutStore.isProcessing">Traitement en cours...</span>
          <span v-else>Confirmer la commande</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCartStore } from '../stores/cart';
import { useCheckoutStore } from '../stores/checkout';

const cartStore = useCartStore();
const checkoutStore = useCheckoutStore();

onMounted(() => {
    checkoutStore.reset();
});

const placeOrder = async () => {
    await checkoutStore.placeOrder();
};
</script>
```

- [ ] **Step 2: Implement `MyOrdersPage.vue`**

```vue
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-8">Mes Commandes</h1>

    <div v-if="orderStore.isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>

    <div v-else-if="orderStore.error" class="text-red-500 text-center py-10">
      {{ orderStore.error }}
    </div>

    <div v-else-if="orderStore.myOrders.length === 0" class="text-center py-10">
      <p class="text-gray-500">Vous n'avez passé aucune commande pour le moment.</p>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-md">
      <ul class="divide-y divide-gray-200">
        <li v-for="order in orderStore.myOrders" :key="order.id">
          <div class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-purple-600 truncate">Commande {{ order.reference }}</p>
              <div class="ml-2 flex-shrink-0 flex">
                <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :style="{ backgroundColor: order.currentState.color + '20', color: order.currentState.color }">
                  {{ order.currentState.label }}
                </p>
              </div>
            </div>
            <div class="mt-2 sm:flex sm:justify-between">
              <div class="sm:flex">
                <p class="flex items-center text-sm text-gray-500">
                  Total: {{ order.totalPaid }} €
                </p>
                <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                  Paiement: {{ order.payment }}
                </p>
              </div>
              <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                <p>
                  Passée le <time :datetime="order.dateAdd">{{ order.dateAdd }}</time>
                </p>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCustomerOrderStore } from '../stores/order';

const orderStore = useCustomerOrderStore();

onMounted(() => {
    orderStore.fetchMyOrders();
});
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/frontoffice/pages/CheckoutPage.vue src/frontoffice/pages/MyOrdersPage.vue
git commit -m "feat: add Checkout and MyOrders pages"
```

---

### Task 7: Update Layout and Router

**Files:**
- Modify: `src/frontoffice/layouts/ShopLayout.vue`
- Modify: `src/frontoffice/router/index.ts`

- [ ] **Step 1: Write implementation for `ShopLayout.vue`**

```vue
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
```

- [ ] **Step 2: Write implementation for `router/index.ts`**

```typescript
import { createRouter, createWebHashHistory } from 'vue-router';
import ShopLayout from '../layouts/ShopLayout.vue';
import HomePage from '../pages/HomePage.vue';
import ProductDetailPage from '../pages/ProductDetailPage.vue';
import CheckoutPage from '../pages/CheckoutPage.vue';
import MyOrdersPage from '../pages/MyOrdersPage.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: ShopLayout,
      children: [
        { path: '', component: HomePage },
        { path: 'product/:id', component: ProductDetailPage },
        { path: 'checkout', component: CheckoutPage },
        { path: 'my-orders', component: MyOrdersPage }
      ]
    }
  ]
});

export default router;
```

- [ ] **Step 3: Commit**

```bash
git add src/frontoffice/layouts/ShopLayout.vue src/frontoffice/router/index.ts
git commit -m "feat: update layout and router to include new pages and components"
```
