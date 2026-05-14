<template>
  <div class="import-page">
    <div class="page-header">
      <h1>Importation de Données</h1>
      <p class="subtitle">Importez vos fichiers CSV et vos images ZIP dans PrestaShop</p>
    </div>

    <div class="modules-grid">
      <!-- Phase 1: Products -->
      <div class="import-card" :class="{'is-disabled': isImporting}">
        <div class="card-header">
          <div class="header-title">
            <span class="step-num">1</span>
            <h2>Produits</h2>
          </div>
          <span class="status-badge" :class="statusProducts">
            {{ statusText(statusProducts) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="form-group">
            <label>Fichier CSV (Taxes, Catégories, Produits)</label>
            <input type="file" accept=".csv" class="file-input" @change="handleFileProductsChange" :disabled="isImporting" />
          </div>

          <div class="error-message" v-if="statusProducts === 'error'">
            {{ errorMessageProducts }}
          </div>

          <div class="stats-grid" v-if="statusProducts === 'success'">
            <div class="stat-box">
              <span class="stat-label">Taxes</span>
              <span class="stat-value">{{ taxCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Catégories</span>
              <span class="stat-value">{{ categoryCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Produits</span>
              <span class="stat-value">{{ productCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 2: Combinations -->
      <div class="import-card" :class="{'is-disabled': isImporting}">
        <div class="card-header">
          <div class="header-title">
            <span class="step-num">2</span>
            <h2>Déclinaisons & Stocks</h2>
          </div>
          <span class="status-badge" :class="statusCombinations">
            {{ statusText(statusCombinations) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="form-group">
            <label>Fichier CSV (Déclinaisons)</label>
            <input type="file" accept=".csv" class="file-input" @change="handleFileCombinationsChange" :disabled="isImporting" />
          </div>

          <div class="error-message" v-if="statusCombinations === 'error'">
            {{ errorMessageCombinations }}
          </div>

          <div class="stats-grid" v-if="statusCombinations === 'success'">
            <div class="stat-box">
              <span class="stat-label">Attributs</span>
              <span class="stat-value">{{ attributeCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Valeurs</span>
              <span class="stat-value">{{ attributeValueCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Déclinaisons</span>
              <span class="stat-value">{{ combinationCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 3: Orders -->
      <div class="import-card" :class="{'is-disabled': isImporting}">
        <div class="card-header">
          <div class="header-title">
            <span class="step-num">3</span>
            <h2>Commandes</h2>
          </div>
          <span class="status-badge" :class="statusOrders">
            {{ statusText(statusOrders) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="form-group">
            <label>Fichier CSV (Clients, Adresses, Commandes)</label>
            <input type="file" accept=".csv" class="file-input" @change="handleFileOrdersChange" :disabled="isImporting" />
          </div>

          <div class="error-message" v-if="statusOrders === 'error'">
            {{ errorMessageOrders }}
          </div>

          <div class="stats-grid" v-if="statusOrders === 'success'">
            <div class="stat-box">
              <span class="stat-label">Clients</span>
              <span class="stat-value">{{ customerCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Adresses</span>
              <span class="stat-value">{{ addressCount }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Commandes</span>
              <span class="stat-value">{{ orderCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase 4: Images -->
      <div class="import-card" :class="{'is-disabled': isImporting}">
        <div class="card-header">
          <div class="header-title">
            <span class="step-num">4</span>
            <h2>Images</h2>
          </div>
          <span class="status-badge" :class="statusImages">
            {{ statusText(statusImages) }}
          </span>
        </div>
        
        <div class="card-body">
          <div class="form-group">
            <label>Archive ZIP (Images des produits)</label>
            <input type="file" accept=".zip" class="file-input" @change="handleFileImagesChange" :disabled="isImporting" />
          </div>

          <div class="error-message" v-if="statusImages === 'error'">
            {{ errorMessageImages }}
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="action-bar">
      <div class="action-info">
        <span v-if="isImporting" class="importing-text">
          <span class="spinner"></span> Importation en cours...
        </span>
        <span v-else class="ready-text">
          Prêt à importer. Veuillez sélectionner les fichiers requis.
        </span>
      </div>
      
      <button class="btn-primary" @click="startGlobalImport" :disabled="!canImport || isImporting">
        Lancer l'importation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { importProducts, taxRateMap, categoryMap, productMap } from '@features/import/services/productImportService';
import { importCombinationsAndStocks, attributeMap, attributeValueMap, combinationMap } from '@features/import/services/combinationImportService';
import { importOrders, customerMap, addressMap, orderCountMap } from '@features/import/services/orderImportService';
import { importImages } from '@features/import/services/imageImportService';

// --- State Global ---
const isImporting = ref(false);

// --- State Produits ---
const selectedFileProducts = ref<File | null>(null);
const statusProducts = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageProducts = ref<string>('');

// --- State Combinaisons ---
const selectedFileCombinations = ref<File | null>(null);
const statusCombinations = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageCombinations = ref<string>('');

// --- State Commandes ---
const selectedFileOrders = ref<File | null>(null);
const statusOrders = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageOrders = ref<string>('');

// --- State Images ---
const selectedFileImages = ref<File | null>(null);
const statusImages = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageImages = ref<string>('');

// --- Computed ---
const canImport = computed(() => {
  return selectedFileProducts.value || 
         selectedFileCombinations.value || 
         selectedFileOrders.value || 
         selectedFileImages.value;
});

const statusText = (status: string) => {
  switch (status) {
    case 'waiting': return 'En attente';
    case 'loading': return 'En cours';
    case 'success': return 'Terminé';
    case 'error': return 'Erreur';
    default: return 'En attente';
  }
};

// --- Handlers fichiers ---
const handleFileProductsChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFileProducts.value = target.files[0];
    statusProducts.value = 'waiting';
    errorMessageProducts.value = '';
  }
};

const handleFileCombinationsChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFileCombinations.value = target.files[0];
    statusCombinations.value = 'waiting';
    errorMessageCombinations.value = '';
  }
};

const handleFileOrdersChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFileOrders.value = target.files[0];
    statusOrders.value = 'waiting';
    errorMessageOrders.value = '';
  }
};

const handleFileImagesChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFileImages.value = target.files[0];
    statusImages.value = 'waiting';
    errorMessageImages.value = '';
  }
};

// --- Actions import globales ---
const startGlobalImport = async () => {
  if (!canImport.value) return;
  isImporting.value = true;

  // 1. Produits
  if (selectedFileProducts.value) {
    statusProducts.value = 'loading';
    errorMessageProducts.value = '';
    try {
      await importProducts(selectedFileProducts.value);
      statusProducts.value = 'success';
    } catch (error: any) {
      statusProducts.value = 'error';
      errorMessageProducts.value = error.message || 'Erreur lors de l\'importation des produits';
      console.error(error);
      isImporting.value = false;
      return;
    }
  }

  // 2. Déclinaisons
  if (selectedFileCombinations.value) {
    if (selectedFileProducts.value && statusProducts.value !== 'success') {
      isImporting.value = false;
      return;
    }
    statusCombinations.value = 'loading';
    errorMessageCombinations.value = '';
    try {
      await importCombinationsAndStocks(selectedFileCombinations.value);
      statusCombinations.value = 'success';
    } catch (error: any) {
      statusCombinations.value = 'error';
      errorMessageCombinations.value = error.message || 'Erreur lors de l\'importation des déclinaisons';
      console.error(error);
      isImporting.value = false;
      return;
    }
  }

  // 3. Commandes
  if (selectedFileOrders.value) {
    if (selectedFileProducts.value && statusProducts.value !== 'success') {
        isImporting.value = false;
        return;
    }
    if (selectedFileCombinations.value && statusCombinations.value !== 'success') {
        isImporting.value = false;
        return;
    }
    statusOrders.value = 'loading';
    errorMessageOrders.value = '';
    try {
      await importOrders(selectedFileOrders.value);
      statusOrders.value = 'success';
    } catch (error: any) {
      statusOrders.value = 'error';
      errorMessageOrders.value = error.message || 'Erreur lors de l\'importation des commandes';
      console.error(error);
      isImporting.value = false;
      return;
    }
  }

  // 4. Images
  if (selectedFileImages.value) {
    if (selectedFileProducts.value && statusProducts.value !== 'success') {
      isImporting.value = false;
      return;
    }
    statusImages.value = 'loading';
    errorMessageImages.value = '';
    try {
      await importImages(selectedFileImages.value);
      statusImages.value = 'success';
    } catch (error: any) {
      statusImages.value = 'error';
      errorMessageImages.value = error.message || 'Erreur lors de l\'importation des images';
      console.error(error);
    }
  }

  isImporting.value = false;
};

// --- Computed : compteurs ---
const taxCount      = computed(() => taxRateMap?.size || 0);
const categoryCount = computed(() => categoryMap?.size || 0);
const productCount  = computed(() => productMap?.size || 0);

const attributeCount = computed(() => attributeMap?.size || 0);
const attributeValueCount = computed(() => {
  let count = 0;
  if (attributeValueMap) {
    attributeValueMap.forEach((valMap) => { count += valMap.size; });
  }
  return count;
});
const combinationCount = computed(() => combinationMap?.size || 0);

const customerCount = computed(() => customerMap?.size || 0);
const addressCount  = computed(() => addressMap?.size || 0);
const orderCount    = computed(() => orderCountMap?.size || 0);
</script>

<style scoped>
.import-page {
  padding-bottom: 6rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.875rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
}

.modules-grid {
  display: grid;
  gap: 1.5rem;
}

.import-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
  overflow: hidden;
}

.import-card.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.card-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: var(--accent-primary);
  color: white;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
}

.card-header h2 {
  font-size: 1.125rem;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.waiting {
  background-color: #f1f5f9;
  color: #64748b;
}

.status-badge.loading {
  background-color: #dbeafe;
  color: #2563eb;
}

.status-badge.success {
  background-color: #d1fae5;
  color: #059669;
}

.status-badge.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.card-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.75rem;
  color: var(--text-main);
  font-size: 0.875rem;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: #fff;
  color: var(--text-main);
}

.file-input::file-selector-button {
  background-color: #f1f5f9;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.375rem 0.75rem;
  margin-right: 1rem;
  color: var(--text-main);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.file-input::file-selector-button:hover {
  background-color: #e2e8f0;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border-left: 4px solid var(--accent-danger);
  color: var(--accent-danger);
  font-size: 0.875rem;
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.stat-box {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 260px; /* Sidebar width */
  right: 0;
  background-color: var(--surface-color);
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.ready-text {
  color: var(--text-muted);
}

.importing-text {
  color: var(--accent-primary);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--accent-primary);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--accent-primary-hover);
}

.btn-primary:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.8;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .action-bar {
    left: 0;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    text-align: center;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>