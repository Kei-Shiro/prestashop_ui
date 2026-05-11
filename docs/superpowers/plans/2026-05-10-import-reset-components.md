# Import/Reset Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two simple Vue components (Import + Reset) with minimal UI, an endpoint list for import, and basic feedback messages.

**Architecture:** Keep logic inside each component, reuse existing services (`import-service`, `reset-service`), and render both in `App.vue` next to `ProductPage`.

**Tech Stack:** Vue 3, TypeScript, Vite.

---

## File Structure

- Create: `src/components/Import.vue` (UI + import logic)
- Modify: `src/components/Reset.vue` (add comments + simple CSS + align feedback)
- Modify: `src/App.vue` (render Import component)

Note: Per spec, no automated tests are added.

---

### Task 1: Create Import component

**Files:**
- Create: `src/components/Import.vue`

- [ ] **Step 1: Create `src/components/Import.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import importService from '../services/import-service'

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
```

- [ ] **Step 2: Optional commit**

```bash
git add src/components/Import.vue
git commit -m "feat: add simple import component"
```

---

### Task 2: Update Reset component

**Files:**
- Modify: `src/components/Reset.vue`

- [ ] **Step 1: Replace `src/components/Reset.vue` with the following**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import resetService from '../services/reset-service'

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
```

- [ ] **Step 2: Optional commit**

```bash
git add src/components/Reset.vue
git commit -m "chore: add comments and base styles to reset"
```

---

### Task 3: Render Import in App

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Replace `src/App.vue` with the following**

```vue
<script setup>
import ProductPage from './pages/ProductPage.vue'
import Import from './components/Import.vue'
import Reset from './components/Reset.vue'
</script>

<template>
  <main>
    <section>
      <h2>Produits</h2>
      <ProductPage />
    </section>

    <section>
      <h2>Import</h2>
      <Import />
    </section>

    <section>
      <h2>Reset</h2>
      <Reset />
    </section>
  </main>
</template>

<style scoped>
main {
  display: grid;
  gap: 1.5rem;
  padding: 1rem;
}

section {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 6px;
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}
</style>
```

- [ ] **Step 2: Optional commit**

```bash
git add src/App.vue
git commit -m "feat: render import and reset sections"
```

---

### Task 4: Manual check (no automated tests)

**Files:**
- None

- [ ] **Step 1: Run the dev server**

Run: `npm run dev`

Expected: Vite dev server starts without errors.

- [ ] **Step 2: Manual UI check**

1. Load the app in the browser.
2. In Import, click Import with no file and no URL.
3. Verify error message appears.
4. Select a file and click Import.
5. Verify loading state toggles and message updates.
6. Click Reset and verify loading state toggles and message updates.

- [ ] **Step 3: Optional commit**

```bash
git status
```
