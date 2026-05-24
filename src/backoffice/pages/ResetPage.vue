<script setup lang="ts">
import { ref } from 'vue';
import { resetService } from '@shared/models/auth';
import PageHeader from '@features/dashboard/components/PageHeader.vue';

const isConfirming = ref(false);
const isResetting = ref(false);
const resetSuccess = ref(false);
const errorMessage = ref('');

const resetData = async () => {
  isResetting.value = true;
  errorMessage.value = '';
  resetSuccess.value = false;

  try {
    await resetService.resetAll();
    resetSuccess.value = true;
    isConfirming.value = false;
  } catch (error) {
    errorMessage.value = "Une erreur s'est produite lors de la purge. Vérifiez la connexion avec le serveur.";
    console.error("Reset error:", error);
  } finally {
    isResetting.value = false;
  }
};
</script>

<template>
  <div class="reset-page">
    <PageHeader 
      title="Maintenance Système" 
      description="Zone critique d'administration de la base de données." 
    />

    <div class="reset-container">
      <div class="reset-card">
        <div class="card-icon warning-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        
        <h2 class="card-title">Réinitialisation des Données</h2>
        <p class="card-text">
          Cette action purgera définitivement la base de données actuelle de l'ensemble de ses tables.
          Aucun retour en arrière ne sera possible. Veuillez procéder avec précaution.
        </p>

        <div v-if="resetSuccess" class="alert-box success-box">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>La base de données a été réinitialisée avec succès.</p>
        </div>

        <div v-if="errorMessage" class="alert-box error-box">
          <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p>{{ errorMessage }}</p>
        </div>

        <div class="action-area" v-if="!resetSuccess">
          <button v-if="!isConfirming" @click="isConfirming = true" class="btn-danger-outline">
            Demander la réinitialisation
          </button>
          
          <div v-else class="confirmation-group">
            <p class="confirm-prompt">Êtes-vous sûr de vouloir continuer ?</p>
            <div class="btn-group">
              <button @click="isConfirming = false" class="btn-secondary" :disabled="isResetting">Annuler</button>
              <button @click="resetData" class="btn-danger-fill" :disabled="isResetting">
                <span v-if="isResetting" class="spinner"></span>
                {{ isResetting ? 'Purge en cours...' : 'Confirmer la suppression' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
  animation: fadeIn var(--transition-fast);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
}

.reset-card {
  max-width: 540px;
  width: 100%;
  text-align: center;
  padding: 3rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.reset-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: var(--accent-danger);
}

.card-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.warning-icon {
  background-color: #fee2e2;
  color: var(--accent-danger);
}

.warning-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--text-main);
}

.card-text {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.alert-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
}

.alert-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.success-box {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.error-box {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.btn-danger-outline {
  display: inline-flex;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent-danger);
  color: var(--accent-danger);
  background: transparent;
  border-radius: 0.375rem;
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

.confirmation-group {
  animation: fadeIn var(--transition-fast);
  background: var(--bg-color);
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.confirm-prompt {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 1.25rem;
}

.btn-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-color);
  color: var(--text-main);
  background: var(--surface-color);
  border-radius: 0.375rem;
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-color);
  border-color: var(--border-hover);
}

.btn-danger-fill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--accent-danger);
  background: var(--accent-danger);
  color: #fff;
  border-radius: 0.375rem;
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-danger-fill:hover:not(:disabled) {
  background: var(--accent-danger-hover);
  border-color: var(--accent-danger-hover);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
