<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from '@features/dashboard/components/Sidebar.vue';

const route = useRoute();

const isAuthenticated = computed(() => {
  return route.path !== '/login' && localStorage.getItem('admin_token') !== null;
});
</script>

<template>
  <div class="app-layout">
    <Sidebar />

    <main :class="['main-content', { 'is-auth': isAuthenticated }]">
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');

:root {
  --font-main: 'Manrope', sans-serif;
  
  --bg-color: #f8fafc;
  --surface-color: #ffffff;
  
  --text-main: #0f172a;
  --text-muted: #64748b;
  
  --border-color: #e2e8f0;
  --border-hover: #cbd5e1;
  
  --accent-primary: #2563eb;
  --accent-primary-hover: #1d4ed8;
  --accent-danger: #ef4444;
  --accent-danger-hover: #dc2626;
  --accent-success: #10b981;
  
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  
  --transition-fast: 0.15s ease-in-out;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-main);
  background-color: var(--bg-color);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-main);
  font-weight: 600;
  color: var(--text-main);
}

.app-layout {
  display: flex;
  min-height: 100vh;
}

/* Main Content */
.main-content {
  flex: 1;
  width: 100%;
}

.main-content.is-auth {
  margin-left: 260px;
}

.content-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 2rem;
}
</style>
