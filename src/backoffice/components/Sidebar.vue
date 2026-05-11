<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isAuthenticated = computed(() => {
  return route.path !== '/login' && localStorage.getItem('admin_token') !== null;
});

const logout = () => {
  localStorage.removeItem('admin_token');
  router.push('/login');
};
</script>

<template>
  <aside v-if="isAuthenticated" class="sidebar">
    <div class="sidebar-header">
      <h1 class="brand">L'Édition</h1>
      <span class="subtitle">Admin Workspace</span>
    </div>
    
    <nav class="nav-menu">
      <router-link to="/orders" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <span class="nav-text">Commandes</span>
      </router-link>
      <router-link to="/import" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
        <span class="nav-text">Importation</span>
      </router-link>
      <router-link to="/reset" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <span class="nav-text">Réinitialisation</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="logout" class="btn-logout">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Déconnexion
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background-color: var(--surface-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 10;
}

.sidebar-header {
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.brand {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.25rem;
  color: var(--text-main);
}

.subtitle {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.nav-menu {
  flex: 1;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  text-decoration: none;
  color: var(--text-muted);
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  opacity: 0.7;
}

.nav-item:hover {
  background-color: var(--bg-color);
  color: var(--text-main);
}

.nav-item.router-link-active {
  background-color: #eff6ff;
  color: var(--accent-primary);
}

.nav-item.router-link-active .nav-icon {
  opacity: 1;
}

.sidebar-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
}

.btn-logout {
  background: none;
  border: none;
  font-family: var(--font-main);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.btn-logout:hover {
  color: var(--accent-danger);
}
</style>
