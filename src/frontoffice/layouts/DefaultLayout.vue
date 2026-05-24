<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <div class="header-left">
          <router-link to="/" class="logo">Maison Boutique</router-link>
        </div>
        
        <nav class="nav">
          <router-link to="/shop" class="nav-item">Shop</router-link>
          <router-link v-if="authStore.isAuthenticated && !authStore.isAnonymous" to="/orders" class="nav-item">Orders</router-link>
          <button v-if="authStore.isAuthenticated" @click="logout" class="nav-item btn-link">Account</button>
          
          <router-link to="/cart" class="nav-item cart-link">
            Cart <span v-if="cartStore.totalItems > 0" class="cart-badge">{{ cartStore.totalItems }}</span>
          </router-link>
        </nav>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-col">
            <span class="col-label">Shop</span>
            <ul class="footer-links">
              <li><router-link to="/shop">All Collections</router-link></li>
              <li><router-link to="/shop">New Arrivals</router-link></li>
            </ul>
          </div>
          <div class="footer-col">
            <span class="col-label">Support</span>
            <ul class="footer-links">
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col brand-col">
            <div class="footer-logo">Maison Boutique</div>
            <p class="footer-copy">&copy; 2026 Maison Boutique. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@shared/models/cart';
import { useCustomerAuthStore as useAuthStore } from '@shared/models/auth';
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
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #111;
  background: #fff;
  -webkit-font-smoothing: antialiased;
}

/* Header */
.header {
  border-bottom: 1px solid #eeeeee;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  color: #111;
  letter-spacing: -0.01em;
}

/* Navigation */
.nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-item {
  text-decoration: none;
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-item:hover, .router-link-active {
  color: #111;
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  cursor: pointer;
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cart-badge {
  font-size: 0.75rem;
  font-weight: 600;
  background: #111;
  color: #fff;
  width: 1.1rem;
  height: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

/* Main */
.main {
  flex-grow: 1;
  width: 100%;
}

/* Footer */
.footer {
  border-top: 1px solid #eeeeee;
  padding: 5rem 2rem 3rem;
  background: #fafafa;
}

.footer-inner {
  max-width: 1400px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 4rem;
}

.col-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #888;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.8rem;
}

.footer-links a {
  text-decoration: none;
  color: #444;
  font-size: 0.85rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #111;
}

.brand-col {
  text-align: right;
}

.footer-logo {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.footer-copy {
  font-size: 0.75rem;
  color: #999;
}

@media (max-width: 768px) {
  .header-inner { padding: 1rem; }
  .nav { gap: 1rem; }
  .brand-col { text-align: left; }
  .footer-grid { grid-template-columns: 1fr; gap: 2rem; }
}
</style>