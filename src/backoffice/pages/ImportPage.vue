<script setup lang="ts">
import { ref, computed } from 'vue';
import { parseCsvFile } from '@features/import/services/csv-parser.service';
import { orchestrateImport } from '@features/import/services/import-orchestrator';
import FileDropZone from '@features/import/components/FileDropZone.vue';
import ImportProgress from '@features/import/components/ImportProgress.vue';
import type { ImportFile, ImportDetail } from '@features/import/types/import.types';
import PageHeader from '../components/PageHeader.vue';

// State for files, importing status, and progress
const files = ref<ImportFile[]>([]);
const isImporting = ref(false);
const progressDetails = ref<ImportDetail[]>([]);

const canSubmit = computed(() => {
  return files.value.length > 0;
});

const handleFilesSelected = async (selectedFiles: File[]) => {
  for (const file of selectedFiles) {
    try {
      const parsedData = await parseCsvFile(file);
      files.value.push({
        id: Date.now() + Math.random(),
        file,
        parsedData,
        endpoint: ''
      });
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
    }
  }
};

const removeFile = (id: number) => {
  files.value = files.value.filter(f => f.id !== id);
};

const startImport = async () => {
  if (!canSubmit.value) return;
  
  isImporting.value = true;
  progressDetails.value = [];

  try {
    const results = await orchestrateImport(files.value);
    progressDetails.value = results;
  } catch (error) {
    console.error("Import error:", error);
  } finally {
    isImporting.value = false;
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
        <FileDropZone @files-selected="handleFilesSelected" />

        <div v-if="files.length > 0" class="file-list">
          <div v-for="file in files" :key="file.id" class="file-item">
            <span class="file-name">{{ file.file.name }}</span>
            <button type="button" class="btn-remove" @click="removeFile(file.id)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <ImportProgress v-if="progressDetails.length > 0" :details="progressDetails" />
      </div>

      <div class="card-footer">
        <button 
          class="btn-primary" 
          :disabled="!canSubmit || isImporting"
          @click="startImport"
        >
          <span v-if="isImporting" class="spinner"></span>
          {{ isImporting ? 'Traitement en cours...' : 'Lancer l\'importation' }}
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

.file-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.file-name {
  font-size: 0.875rem;
  color: var(--text-main);
}

.btn-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: var(--transition-fast);
}

.btn-remove:hover {
  color: var(--accent-danger);
  background: rgba(239, 68, 68, 0.1);
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
