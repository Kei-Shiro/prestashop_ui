<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <router-link to="/" class="header-logo">Maison Boutique</router-link>
        <nav class="header-nav">
          <router-link to="/shop" class="nav-link">Collections</router-link>
          <router-link v-if="authStore.isAuthenticated && !authStore.isAnonymous" to="/orders" class="nav-link">Commandes</router-link>
          <button v-if="authStore.isAuthenticated" @click="logout" class="nav-link nav-btn">Quitter</button>
          <router-link to="/cart" class="nav-link nav-cart">
            Panier
            <span v-if="cartStore.totalItems > 0" class="cart-count">{{ cartStore.totalItems }}</span>
          </router-link>
        </nav>
      </div>
    </header>

    <main class="layout-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="footer">
      <div class="footer-brand">Maison Boutique</div>
      <p class="footer-copy">&copy; 2026 Édition Limitée. Tous droits réservés.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '../stores/cart';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const cartStore = useCartStore();
const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
  await authStore.logout();
  router.push('/');
};
</script>

<style scoped>
/* Layout */
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 249, 248, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-logo {
  font-family: 'Playfair Display', serif;
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 600;
  color: #1a1a2e;
  text-decoration: none;
  transition: opacity 0.3s;
}
.header-logo:hover {
  opacity: 0.7;
}

/* Nav */
.header-nav {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}
.nav-link {
  font-family: 'Outfit', sans-serif;
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  text-decoration: none;
  position: relative;
  transition: color 0.3s;
}
.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 1px;
  bottom: -4px;
  left: 0;
  background-color: #1a1a2e;
  transition: width 0.3s ease;
}
.nav-link:hover,
.nav-link.router-link-active {
  color: #1a1a2e;
}
.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}
.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.nav-btn::after {
  display: none;
}
.nav-cart {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.cart-count {
  background: #1a1a2e;
  color: #faf9f8;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  transition: background 0.3s;
}
.nav-cart:hover .cart-count { 
  background: #555; 
}

/* Main */
.layout-main { 
  flex-grow: 1; 
}

/* Footer */
.footer {
  background: #1a1a2e;
  color: #faf9f8;
  padding: 4rem 2rem;
  text-align: center;
  margin-top: auto;
}
.footer-brand {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: 1.5rem;
  color: #fff;
  margin-bottom: 1rem;
}
.footer-copy { 
  font-family: 'Outfit', sans-serif;
  font-size: 0.75rem; 
  letter-spacing: 0.05em;
  opacity: 0.5; 
  margin: 0; 
  text-transform: uppercase;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(10px); }
</style>