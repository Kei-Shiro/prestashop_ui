<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="brand">L'Édition</h1>
        <p class="subtitle">Connexion à l'espace d'administration</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Adresse email</label>
          <div class="input-wrapper">
            <input id="email" v-model="email" type="email" required placeholder="admin@test.com" />
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="input-wrapper">
            <input id="password" v-model="password" type="password" required placeholder="••••••••" />
          </div>
        </div>
        
        <div v-if="errorMessage" class="error-message">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="error-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="submit-btn">
          Se connecter
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const email = ref('admin@test.com');
const password = ref('password');
const errorMessage = ref('');

const handleLogin = () => {
    // Hardcoded credentials for mock
    if (email.value === 'admin@test.com' && password.value === 'password') {
        localStorage.setItem('admin_token', 'mock-jwt-token-12345');
        router.push('/');
    } else {
        errorMessage.value = 'Email ou mot de passe incorrect.';
    }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  padding: 1rem;
}

.login-card {
  background: var(--surface-color);
  padding: 2.5rem 2.5rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 420px;
  border: 1px solid var(--border-color);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--text-main);
  background-color: var(--surface-color);
  transition: var(--transition-fast);
  font-family: inherit;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input-wrapper input::placeholder {
  color: #94a3b8;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--accent-danger);
  font-size: 0.875rem;
  border-radius: 8px;
  font-weight: 500;
}

.error-icon {
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background-color: var(--accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
  margin-top: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.submit-btn:hover {
  background-color: var(--accent-primary-hover);
}

.submit-btn:active {
  transform: translateY(1px);
}
</style>
