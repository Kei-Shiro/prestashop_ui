<template>
  <div class="user-selection-page">
    <div class="user-selection-header">
      <h1 class="user-selection-title">Bienvenue sur notre boutique</h1>
      <p class="user-selection-subtitle">Veuillez choisir un profil pour continuer (Evaluation uniquement)</p>
    </div>

    <div v-if="loading" class="user-selection-loading">Chargement des utilisateurs...</div>
    <div v-else-if="error" class="user-selection-error">{{ error }}</div>
    <div v-else class="user-grid">
      <div 
        @click="selectAnonymous"
        class="user-card user-card-anonymous"
      >
        <h2 class="user-card-name">Visiteur Anonyme</h2>
        <p class="user-card-email">Commander sans compte</p>
      </div>

      <div 
        v-for="user in users" 
        :key="user.id" 
        @click="selectUser(user)"
        class="user-card"
      >
        <h2 class="user-card-name">{{ user.firstname }} {{ user.lastname }}</h2>
        <p class="user-card-email">{{ user.email }}</p>
        <span class="user-card-badge">Client Existant</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { customerService } from '@shared/services/customer-service';

const router = useRouter();
const authStore = useAuthStore();

const users = ref<any[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
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
  padding: 60px 20px;
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}
.user-selection-header {
  margin-bottom: 50px;
}
.user-selection-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}
.user-selection-subtitle {
  color: #666;
  font-size: 1rem;
}
.user-selection-loading {
  color: #666;
  padding: 60px 0;
}
.user-selection-error {
  color: #c00;
  padding: 60px 0;
}
.user-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}
.user-card {
  border: 1px solid #ddd;
  padding: 30px;
  cursor: pointer;
  background: #fff;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: all 0.2s;
}
.user-card:hover {
  border-color: #333;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.user-card-anonymous {
  border-style: dashed;
  background: transparent;
}
.user-card-anonymous:hover {
  background: #f9f9f9;
}
.user-card-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.user-card-email {
  color: #666;
  font-size: 0.9rem;
}
.user-card-badge {
  display: inline-block;
  margin-top: 15px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
  border: 1px solid #ddd;
  padding: 4px 10px;
}
</style>
