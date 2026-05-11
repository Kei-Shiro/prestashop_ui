<script setup lang="ts">
import { ref } from 'vue'
import importService from '@shared/services/import-service'

// Liste simple des endpoints disponibles
const endpoints = [
  { value: '/products', label: 'Produits' },
  { value: '/customers', label: 'Clients' },
  { value: '/orders', label: 'Commandes' },
]

// Etat du formulaire
const selectedFile = ref<File | null>(null)
const sheetUrl = ref('')
const endpoint = ref(endpoints[0].value)

// Etat UI
const loading = ref(false)
const message = ref('')
const error = ref('')

function onFileChange(event: Event) {
  // Recupere le fichier choisi
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

async function submitImport() {
  // Reset des messages avant l'action
  message.value = ''
  error.value = ''

  // Validation minimale
  if (!selectedFile.value && !sheetUrl.value.trim()) {
    error.value = 'Veuillez choisir un fichier ou une URL Google Sheet.'
    return
  }

  loading.value = true
  try {
    // Priorite au fichier si present
    if (selectedFile.value) {
      await importService.importFile(selectedFile.value, endpoint.value)
    } else {
      await importService.importGoogleSheet(sheetUrl.value.trim(), endpoint.value)
    }
    message.value = 'Import reussi.'
  } catch (e: any) {
    error.value = 'Import echoue: ' + (e?.message || 'Erreur inconnue')
    console.error('Import error:', e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitImport">
    <label>
      Endpoint
      <select v-model="endpoint">
        <option v-for="ep in endpoints" :key="ep.value" :value="ep.value">
          {{ ep.label }}
        </option>
      </select>
    </label>

    <label>
      Fichier (CSV/XLSX/XLS)
      <input type="file" accept=".csv,.xls,.xlsx" @change="onFileChange" />
    </label>

    <label>
      URL Google Sheet
      <input
        v-model.trim="sheetUrl"
        type="text"
        placeholder="https://docs.google.com/spreadsheets/..."
      />
    </label>

    <small>Si fichier et URL, le fichier est prioritaire.</small>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Import en cours...' : 'Importer' }}
    </button>

    <p v-if="message" class="success">{{ message }}</p>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<style scoped>
form {
  display: grid;
  gap: 0.5rem;
  max-width: 420px;
}

label {
  display: grid;
  gap: 0.25rem;
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
