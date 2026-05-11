<script setup lang="ts">
import { ref } from 'vue'
import resetService from '@shared/services/reset-service'

// Etat UI
const loading = ref(false)
const message = ref('')
const error = ref('')

async function reset() {
  // Demarre l'action de reset
  loading.value = true
  // Reset des messages
  message.value = ''
  error.value = ''

  try {
    // Appel du service de reset
    await resetService.resetAll()
    message.value = 'Reset reussi.'
  } catch (e: any) {
    error.value = 'Reset echoue: ' + (e?.message || 'Erreur inconnue')
    console.error('Reset error:', e)
  } finally {
    // Termine l'action
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="reset">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Reset en cours...' : 'Reset' }}
    </button>
    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<style scoped>
form {
  display: grid;
  gap: 0.5rem;
  max-width: 320px;
}

button {
  padding: 0.5rem 0.75rem;
}

.success {
  color: #1b5e20;
}

.error {
  color: #b00020;
}
</style>
