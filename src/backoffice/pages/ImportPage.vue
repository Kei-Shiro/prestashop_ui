<script setup lang="ts">
import { ref, computed } from 'vue';
import { parseCsvFile } from '@features/import/services/csv-parser.service';
import { extractZipComplete } from '@features/import/services/zip-extractor.service';
import { orchestrateImport } from '@features/import/services/import-orchestrator';
import FileDropZone from '@features/import/components/FileDropZone.vue';
import ImportProgress from '@features/import/components/ImportProgress.vue';
import MappingPreview from '@features/import/components/MappingPreview.vue';
import type { ImportFile, ImportDetail, ImportProgress as ImportProgressType, EntityType } from '@features/import/types/import.types';
import PageHeader from '../components/PageHeader.vue';

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'product', label: 'Produits' },
  { value: 'combination', label: 'Combinaisons' },
  { value: 'customer', label: 'Clients' },
  { value: 'order', label: 'Commandes' },
  { value: 'category', label: 'Catégories' },
];

const ENTITY_LABELS: Record<string, string> = {
  product: 'Produits', combination: 'Combinaisons', customer: 'Clients',
  order: 'Commandes', category: 'Catégories', unknown: 'Non détecté',
};

const ENTITY_COLORS: Record<string, string> = {
  product: '#3b82f6', combination: '#8b5cf6', customer: '#10b981',
  order: '#f59e0b', category: '#ec4899', unknown: '#94a3b8',
};

// State
const files = ref<ImportFile[]>([]);
const isImporting = ref(false);
const progressDetails = ref<ImportDetail[]>([]);
const progressPercentage = ref(0);
const progressPhase = ref('');

const globalErrors = computed(() => progressDetails.value.flatMap(d => d.errors));
const canSubmit = computed(() => files.value.length > 0 && !isImporting.value);
const totalRows = computed(() => files.value.reduce((s, f) => s + f.rows, 0));
const totalImages = computed(() => files.value.reduce((s, f) => s + (f.imageCount || 0), 0));

const handleFilesSelected = async (selectedFiles: File[]) => {
  for (const file of selectedFiles) {
    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const extracted = await extractZipComplete(file);
        const importFile: ImportFile = {
          id: `zip_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file, name: file.name, type: 'zip',
          detectedEntity: 'unknown',
          rows: extracted.csvFiles.length,
          imageCount: extracted.imageFiles.length,
          preview: [],
        };
        files.value.push(importFile);
      } else {
        const parsedFile = await parseCsvFile(file);
        files.value.push(parsedFile);
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
    }
  }
};

const removeFile = (id: string) => {
  files.value = files.value.filter(f => f.id !== id);
};

const setOverrideEndpoint = (fileId: string, endpoint: string) => {
  const file = files.value.find(f => f.id === fileId);
  if (file) file.overrideEndpoint = endpoint || undefined;
};

const handleProgress = (progress: ImportProgressType) => {
  progressDetails.value = progress.details;
  progressPercentage.value = progress.percentage;
  progressPhase.value = progress.phase;
};

const startImport = async () => {
  if (!canSubmit.value) return;
  isImporting.value = true;
  progressDetails.value = [];
  progressPercentage.value = 0;
  progressPhase.value = 'parsing';

  try {
    const result = await orchestrateImport(files.value, { onProgress: handleProgress });
    progressDetails.value = result.details;
    progressPercentage.value = 100;
    progressPhase.value = result.success ? 'complete' : 'error';
  } catch (error) {
    console.error("Import error:", error);
    progressPhase.value = 'error';
  } finally {
    isImporting.value = false;
  }
};

const copyErrors = () => {
  const text = globalErrors.value.map(e => `Ligne ${e.row}: ${e.message}`).join('\n');
  navigator.clipboard.writeText(text);
};

function getEntityColor(entity: string): string {
  return ENTITY_COLORS[entity] || ENTITY_COLORS.unknown;
}
</script>

<template>
  <div class="import-page">
    <PageHeader
      title="Importation de données"
      description="Importez vos fichiers CSV et ZIP pour alimenter votre catalogue PrestaShop."
    />

    <div class="import-card">
      <div class="card-header">
        <div class="header-left">
          <h2>Fichiers à traiter</h2>
          <p>Déposez vos fichiers CSV et/ou ZIP contenant images et données.</p>
        </div>
        <div v-if="files.length > 0" class="header-stats">
          <span class="stat"><strong>{{ files.length }}</strong> fichier{{ files.length > 1 ? 's' : '' }}</span>
          <span v-if="totalRows > 0" class="stat"><strong>{{ totalRows }}</strong> ligne{{ totalRows > 1 ? 's' : '' }}</span>
          <span v-if="totalImages > 0" class="stat stat-image"><strong>{{ totalImages }}</strong> image{{ totalImages > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div class="card-body">
        <FileDropZone @files="handleFilesSelected" />

        <!-- Liste des fichiers -->
        <div v-if="files.length > 0" class="file-list">
          <TransitionGroup name="file-anim">
            <div v-for="file in files" :key="file.id" class="file-item">
              <div class="file-main">
                <div class="file-icon-wrap">
                  <span v-if="file.type === 'zip'" class="file-icon zip">📦</span>
                  <span v-else class="file-icon csv">📄</span>
                </div>

                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <div class="file-meta">
                    <span v-if="file.type === 'csv'" class="meta-item">{{ file.rows }} lignes</span>
                    <span v-if="file.type === 'zip' && file.imageCount" class="meta-item">{{ file.imageCount }} images</span>
                    <span
                      class="entity-badge"
                      :style="{ backgroundColor: getEntityColor(file.overrideEndpoint || file.detectedEntity) + '15', color: getEntityColor(file.overrideEndpoint || file.detectedEntity), borderColor: getEntityColor(file.overrideEndpoint || file.detectedEntity) + '30' }"
                    >
                      {{ ENTITY_LABELS[file.overrideEndpoint || file.detectedEntity] || file.detectedEntity }}
                    </span>
                  </div>
                </div>

                <!-- Sélecteur d'endpoint fallback -->
                <div v-if="file.detectedEntity === 'unknown' && file.type === 'csv'" class="endpoint-select-wrap">
                  <select
                    class="endpoint-select"
                    :value="file.overrideEndpoint || ''"
                    @change="setOverrideEndpoint(file.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">— Choisir l'entité —</option>
                    <option v-for="opt in ENTITY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>

                <button type="button" class="btn-remove" @click="removeFile(file.id)" :disabled="isImporting">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <!-- Mapping preview (CSV uniquement) -->
              <MappingPreview
                v-if="file.type === 'csv' && file.headers && file.headers.length > 0"
                :entity="(file.overrideEndpoint || file.detectedEntity) as EntityType | 'unknown'"
                :headers="file.headers"
              />
            </div>
          </TransitionGroup>
        </div>

        <!-- Progression -->
        <ImportProgress
          v-if="progressDetails.length > 0 || isImporting"
          :steps="progressDetails"
          :percentage="progressPercentage"
          :phase="progressPhase"
        />

        <!-- Erreurs -->
        <div v-if="globalErrors.length > 0 && !isImporting" class="error-summary">
          <div class="error-header">
            <h3>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {{ globalErrors.length }} erreur{{ globalErrors.length > 1 ? 's' : '' }}
            </h3>
            <button class="btn-copy" @click="copyErrors" title="Copier les erreurs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
          <ul class="error-list">
            <li v-for="(err, idx) in globalErrors.slice(0, 20)" :key="idx">
              <span class="error-badge">{{ err.code }}</span>
              <span v-if="err.row > 0">Ligne {{ err.row }} :</span>
              {{ err.message }}
            </li>
          </ul>
          <p v-if="globalErrors.length > 20" class="error-more">
            … et {{ globalErrors.length - 20 }} autres erreurs
          </p>
        </div>
      </div>

      <div class="card-footer">
        <div class="footer-info">
          <span v-if="progressPhase === 'complete'" class="success-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Import terminé avec succès
          </span>
        </div>
        <button
          class="btn-primary"
          :disabled="!canSubmit"
          @click="startImport"
        >
          <span v-if="isImporting" class="spinner"></span>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          {{ isImporting ? 'Traitement en cours...' : 'Lancer l\'importation' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-page {
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Card */
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}
.card-header h2 { font-size: 1.125rem; margin-bottom: 0.25rem; }
.card-header p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

.header-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.stat {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-color);
  padding: 0.25rem 0.625rem;
  border-radius: 1rem;
  border: 1px solid var(--border-color);
}
.stat strong { color: var(--text-main); }
.stat-image strong { color: #8b5cf6; }

.card-body { padding: 2rem; }
.card-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* File List */
.file-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.file-item {
  padding: 0.75rem 1rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.file-item:hover {
  border-color: var(--border-hover);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.file-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.file-icon-wrap { flex-shrink: 0; }
.file-icon { font-size: 1.5rem; }
.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.file-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* Entity badge */
.entity-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  border: 1px solid;
}

/* Endpoint select */
.endpoint-select-wrap { flex-shrink: 0; }
.endpoint-select {
  font-family: var(--font-main);
  font-size: 0.75rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--surface-color);
  color: var(--text-main);
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.endpoint-select:focus { border-color: var(--accent-primary); }

/* Buttons */
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
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.btn-remove:hover { color: var(--accent-danger); background: rgba(239, 68, 68, 0.1); }
.btn-remove:disabled { opacity: 0.3; cursor: not-allowed; }

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
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover:not(:disabled) { background: var(--accent-primary-hover); }
.btn-primary:disabled { background: var(--border-hover); color: #fff; cursor: not-allowed; box-shadow: none; }

.icon-sm { width: 1.125rem; height: 1.125rem; flex-shrink: 0; }

.spinner {
  width: 1rem; height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Errors */
.error-summary {
  margin-top: 1.5rem;
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
}
.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.error-header h3 {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #ef4444;
  margin: 0;
}
.btn-copy {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.25rem;
  color: #ef4444;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-copy:hover { background: rgba(239, 68, 68, 0.1); }

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 300px;
  overflow-y: auto;
}
.error-list li {
  font-size: 0.75rem;
  color: var(--text-main);
  padding: 0.375rem 0;
  border-bottom: 1px solid rgba(239, 68, 68, 0.08);
}
.error-badge {
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 0.0625rem 0.3125rem;
  border-radius: 0.125rem;
  margin-right: 0.375rem;
}
.error-more {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0.5rem 0 0;
  font-style: italic;
}

/* Success */
.success-message {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #22c55e;
}

/* Transition */
.file-anim-enter-active { transition: all 0.3s ease; }
.file-anim-leave-active { transition: all 0.2s ease; }
.file-anim-enter-from { opacity: 0; transform: translateY(-8px); }
.file-anim-leave-to { opacity: 0; transform: translateX(16px); }
</style>
