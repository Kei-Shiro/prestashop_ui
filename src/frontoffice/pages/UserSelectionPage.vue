<template>
  <div class="user-selection-page">
    <div class="user-selection-header">
      <h1 class="user-selection-title">Connexion</h1>
      <p class="user-selection-subtitle">Veuillez choisir un profil pour accéder à votre espace d'évaluation</p>
    </div>

    <div v-if="loading" class="user-selection-loading">
      <span class="loading-spinner"></span>
      Chargement des profils...
    </div>
    <div v-else-if="error" class="user-selection-error">{{ error }}</div>
    <div v-else class="user-grid">
      <div 
        @click="selectAnonymous"
        class="user-card user-card-anonymous"
      >
        <div class="user-card-content">
          <h2 class="user-card-name">Visiteur Anonyme</h2>
          <p class="user-card-email">Commander sans compte</p>
        </div>
      </div>

      <div 
        v-for="user in users" 
        :key="user.id" 
        @click="selectUser(user)"
        class="user-card"
      >
        <div class="user-card-content">
          <h2 class="user-card-name">{{ user.firstname }} {{ user.lastname }}</h2>
          <p class="user-card-email">{{ user.email }}</p>
          <span class="user-card-badge">Client Existant</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useCartStore } from '../stores/cart';
import { customerService } from '@shared/services/customer-service';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore();

const users = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  cartStore.clearAnonymousCart();
  try {
    const allUsers = await customerService.getAllCustomers();
    users.value = allUsers.filter(u => u.email && u.firstname && u.lastname).slice(0, 10);
  } catch (err) {
    error.value = "Impossible de charger la liste des utilisateurs.";
  } finally {
    loading.value = false;
  }
});

const selectAnonymous = () => {
  authStore.loginAnonymous();
  router.push('/shop');
};

const selectUser = (user: any) => {
  authStore.loginWithoutPassword(user);
  router.push('/shop');
};
</script>

<style scoped>
.user-selection-page {
  padding: 5rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
  min-height: calc(100vh - 250px);
}

.user-selection-header {
  text-align: center;
  margin-bottom: 4rem;
}

.user-selection-title {
  font-family: 'Playfair Display', serif;
  font-size: 2.5rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #1a1a2e;
}

.user-selection-subtitle {
  font-family: 'Outfit', sans-serif;
  color: #555;
  font-size: 1rem;
  letter-spacing: 0.05em;
}

.user-selection-loading {
  text-align: center;
  color: #555;
  font-family: 'Outfit', sans-serif;
  padding: 4rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-top-color: #1a1a2e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.user-selection-error {
  text-align: center;
  color: #8b0000;
  font-family: 'Outfit', sans-serif;
  padding: 4rem 0;
  background-color: #fff5f5;
  border: 1px solid #ffcccc;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.user-card {
  background: #ffffff;
  border: 1px solid #eaeaea;
  cursor: pointer;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  transition: all 0.4s ease;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border: 1px solid transparent;
  transition: border-color 0.4s ease;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(26, 26, 46, 0.06);
}

.user-card:hover::before {
  border-color: #1a1a2e;
}

.user-card-content {
  padding: 2rem;
  width: 100%;
}

.user-card-anonymous {
  background: transparent;
  border: 1px dashed #ccc;
}

.user-card-anonymous:hover {
  background: rgba(255, 255, 255, 0.5);
}

.user-card-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}

.user-card-email {
  font-family: 'Outfit', sans-serif;
  color: #666;
  font-size: 0.875rem;
  font-weight: 300;
}

.user-card-badge {
  display: inline-block;
  margin-top: 1.5rem;
  font-family: 'Outfit', sans-serif;
  font-size: 0.65rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #1a1a2e;
  border-bottom: 1px solid #1a1a2e;
  padding-bottom: 2px;
}
</style>
