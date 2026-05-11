<script setup lang="ts">
import { ref, computed } from 'vue';
import importService, { ImportItem } from '@shared/services/import-service';
import PageHeader from '../components/PageHeader.vue';
import ImportRow from '../components/ImportRow.vue';
import { erasableEndpoints } from '@shared/utils/endpoints';

// Available endpoints dynamically loaded
const endpointOptions = erasableEndpoints.map(endpoint => {
  // Format the label neatly, e.g. "/products" -> "Products (/products)"
  const cleanName = endpoint.replace('/', '');
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return {
    value: endpoint,
    label: `${capitalized} (${endpoint})`
  };
});

let nextId = 1;
const items = ref<ImportItem[]>([
  { id: nextId++, file: null, endpoint: endpointOptions[0]?.value || '' },
  { id: nextId++, file: null, endpoint: endpointOptions[1]?.value || '' }
]);

const isUploading = ref(false);
const uploadSuccess = ref(false);
const errorMessage = ref('');

const canSubmit = computed(() => {
  return items.value.length > 0 && items.value.every(item => item.file !== null && item.endpoint !== '');
});

const addRow = () => {
  items.value.push({ id: nextId++, file: null, endpoint: '' });
};

const removeRow = (id: number) => {
  items.value = items.value.filter(item => item.id !== id);
};

const handleFileSelect = (item: ImportItem, event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    item.file = target.files[0];
  } else {
    item.file = null;
  }
};

const startImport = async () => {
  if (!canSubmit.value) return;
  
  isUploading.value = true;
  uploadSuccess.value = false;
  errorMessage.value = '';

  try {
    await importService.importDynamic(items.value);
    uploadSuccess.value = true;
    
    items.value = [
      { id: nextId++, file: null, endpoint: endpointOptions[0]?.value || '' },
      { id: nextId++, file: null, endpoint: endpointOptions[1]?.value || '' }
    ];
  } catch (error) {
    errorMessage.value = "Une erreur est survenue lors de l'importation. Veuillez vérifier les fichiers et réessayer.";
    console.error("Import error:", error);
  } finally {
    isUploading.value = false;
  }
};
</script>

<template>
  <div class="import-page">
    <PageHeader 
      title="Importation de données" 
      description="Configurez les fichiers à importer et leurs points de terminaison respectifs." 
    />

    <div class="import-card">
      <div class="card-header">
        <h2>Fichiers à traiter</h2>
        <p>Associez chaque fichier à son endpoint de destination.</p>
      </div>

      <div class="card-body">
        <div class="import-list">
          <ImportRow
            v-for="(item, index) in items"
            :key="item.id"
            :item="item"
            :index="index"
            :options="endpointOptions"
            :show-remove="items.length > 1"
            @remove="removeRow"
            @update:endpoint="item.endpoint = $event"
            @file-select="handleFileSelect"
          />
        </div>

        <button type="button" class="btn-outline btn-add" @click="addRow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          Ajouter un champ
        </button>
      </div>

      <div class="card-footer">
        <div class="status-messages">
          <p v-if="uploadSuccess" class="success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Importation réussie avec succès.
          </p>
          <p v-if="errorMessage" class="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ errorMessage }}
          </p>
        </div>
        
        <button 
          class="btn-primary" 
          :disabled="!canSubmit || isUploading"
          @click="startImport"
        >
          <span v-if="isUploading" class="spinner"></span>
          {{ isUploading ? 'Traitement en cours...' : 'Lancer l\'importation' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-page {
  animation: fadeIn var(--transition-fast);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.import-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.card-header h2 {
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
}

.card-header p {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.card-body {
  padding: 2rem;
}

.import-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Add Button */
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: 1px dashed var(--border-hover);
  border-radius: 0.5rem;
  color: var(--text-main);
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  width: 100%;
  justify-content: center;
}

.btn-outline:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: #eff6ff;
}

.icon-sm {
  width: 1.25rem;
  height: 1.25rem;
}

/* Footer & Submit */
.card-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-messages {
  flex: 1;
}

.success-message, .error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.success-message { color: var(--accent-success); }
.error-message { color: var(--accent-danger); }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--accent-primary);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-primary-hover);
}

.btn-primary:disabled {
  background: var(--border-hover);
  color: #fff;
  cursor: not-allowed;
  box-shadow: none;
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
