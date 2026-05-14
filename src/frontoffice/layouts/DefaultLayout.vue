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
      <p class="footer-copy">&copy; 2026 Edition Limitee. Tous droits reserves.</p>
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
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #f1f5f9;
  transition: box-shadow 0.3s;
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-logo {
  font-family: Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  text-decoration: none;
  transition: color 0.2s;
}
.header-logo:hover { color: #475569; }

/* Nav */
.header-nav {
  display: flex;
  align-items: center;
  gap: 32px;
}
.nav-link {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
  text-decoration: none;
  position: relative;
  transition: color 0.2s;
}
.nav-link:hover,
.nav-link.router-link-active { color: #0f172a; }
.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
}
.nav-cart {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cart-count {
  background: #0f172a;
  color: #fff;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  transition: background 0.2s;
}
.nav-cart:hover .cart-count { background: #334155; }

/* Main */
.layout-main { flex-grow: 1; }

/* Footer */
.footer {
  background: #0f172a;
  color: #94a3b8;
  padding: 48px 24px;
  text-align: center;
  margin-top: auto;
}
.footer-brand {
  font-family: Georgia, serif;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #fff;
  margin-bottom: 12px;
  font-size: 0.875rem;
}
.footer-copy { font-size: 0.8125rem; opacity: 0.6; margin: 0; }

/* Transitions */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.35s ease, transform 0.35s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>