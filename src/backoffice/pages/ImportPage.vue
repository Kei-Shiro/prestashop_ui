<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">Import PrestaShop</h1>

    <!-- Phase 1: Produits -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 class="text-xl font-bold mb-4">1. Import Produits (Taxes, Catégories, Produits)</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Fichier CSV (Produits)
        </label>
        <input
            type="file"
            accept=".csv"
            @change="handleFileProductsChange"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
        />
      </div>

      <button
          @click="startImportProducts"
          :disabled="!selectedFileProducts || statusProducts === 'loading'"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="statusProducts === 'loading'">En cours...</span>
        <span v-else>Importer Produits</span>
      </button>

      <div class="mt-4">
        <p v-if="statusProducts === 'waiting'" class="text-gray-500">En attente...</p>
        <p v-else-if="statusProducts === 'loading'" class="text-blue-500 font-medium animate-pulse">Importation en cours...</p>
        <p v-else-if="statusProducts === 'success'" class="text-green-600 font-medium">Terminé avec succès !</p>
        <p v-else-if="statusProducts === 'error'" class="text-red-600 font-medium">Erreur: {{ errorMessageProducts }}</p>
      </div>

      <div v-if="statusProducts === 'success'" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Taxes</h2>
          <p class="text-3xl font-light text-blue-600">{{ taxCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Catégories</h2>
          <p class="text-3xl font-light text-blue-600">{{ categoryCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Produits</h2>
          <p class="text-3xl font-light text-blue-600">{{ productCount }}</p>
        </div>
      </div>
    </div>

    <!-- Phase 2: Déclinaisons & Stocks -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6" :class="{ 'opacity-50 pointer-events-none': statusProducts !== 'success' }">
      <h2 class="text-xl font-bold mb-4">2. Import Déclinaisons & Stocks</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Fichier CSV (Stocks/Déclinaisons)
        </label>
        <input
            type="file"
            accept=".csv"
            @change="handleFileCombinationsChange"
            :disabled="statusProducts !== 'success'"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
        />
      </div>

      <button
          @click="startImportCombinations"
          :disabled="!selectedFileCombinations || statusCombinations === 'loading' || statusProducts !== 'success'"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="statusCombinations === 'loading'">En cours...</span>
        <span v-else>Importer Déclinaisons & Stocks</span>
      </button>

      <div class="mt-4">
        <p v-if="statusCombinations === 'waiting'" class="text-gray-500">En attente...</p>
        <p v-else-if="statusCombinations === 'loading'" class="text-blue-500 font-medium animate-pulse">Importation en cours...</p>
        <p v-else-if="statusCombinations === 'success'" class="text-green-600 font-medium">Terminé avec succès !</p>
        <p v-else-if="statusCombinations === 'error'" class="text-red-600 font-medium">Erreur: {{ errorMessageCombinations }}</p>
      </div>

      <div v-if="statusCombinations === 'success'" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Attributs</h2>
          <p class="text-3xl font-light text-blue-600">{{ attributeCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Valeurs</h2>
          <p class="text-3xl font-light text-blue-600">{{ attributeValueCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Combinaisons</h2>
          <p class="text-3xl font-light text-blue-600">{{ combinationCount }}</p>
        </div>
      </div>
    </div>

    <!-- Phase 3: Clients & Commandes -->
    <div class="bg-white p-6 rounded-lg shadow-md mb-6" :class="{ 'opacity-50 pointer-events-none': statusCombinations !== 'success' }">
      <h2 class="text-xl font-bold mb-4">3. Import Clients & Commandes</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Fichier CSV (Commandes)
        </label>
        <input
            type="file"
            accept=".csv"
            @change="handleFileOrdersChange"
            :disabled="statusCombinations !== 'success'"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
        />
      </div>

      <button
          @click="startImportOrders"
          :disabled="!selectedFileOrders || statusOrders === 'loading' || statusCombinations !== 'success'"
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="statusOrders === 'loading'">En cours...</span>
        <span v-else>Importer Clients & Commandes</span>
      </button>

      <div class="mt-4">
        <p v-if="statusOrders === 'waiting'" class="text-gray-500">En attente...</p>
        <p v-else-if="statusOrders === 'loading'" class="text-blue-500 font-medium animate-pulse">Importation en cours...</p>
        <p v-else-if="statusOrders === 'success'" class="text-green-600 font-medium">Terminé avec succès !</p>
        <p v-else-if="statusOrders === 'error'" class="text-red-600 font-medium">Erreur: {{ errorMessageOrders }}</p>
      </div>

      <div v-if="statusOrders === 'success'" class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Clients</h2>
          <p class="text-3xl font-light text-blue-600">{{ customerCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Adresses</h2>
          <p class="text-3xl font-light text-blue-600">{{ addressCount }}</p>
        </div>
        <div class="bg-white p-4 rounded-lg shadow border border-gray-100 text-center">
          <h2 class="font-bold text-gray-700 mb-2">Commandes</h2>
          <p class="text-3xl font-light text-blue-600">{{ orderCount }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { importProducts, taxRateMap, categoryMap, productMap } from '@features/import/services/productImportService';
import { importCombinationsAndStocks, attributeMap, attributeValueMap, combinationMap } from '@features/import/services/combinationImportService';
import { importOrders, customerMap, addressMap, orderCountMap } from '@features/import/services/orderImportService';

// ── State Produits ────────────────────────────────────────────────────────────
const selectedFileProducts = ref<File | null>(null);
const statusProducts = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageProducts = ref<string>('');

// ── State Combinaisons ────────────────────────────────────────────────────────
const selectedFileCombinations = ref<File | null>(null);
const statusCombinations = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageCombinations = ref<string>('');

// ── State Commandes ───────────────────────────────────────────────────────────
const selectedFileOrders = ref<File | null>(null);
const statusOrders = ref<'waiting' | 'loading' | 'success' | 'error'>('waiting');
const errorMessageOrders = ref<string>('');

// ── Handlers fichiers ─────────────────────────────────────────────────────────
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

// ── Actions import ────────────────────────────────────────────────────────────
const startImportProducts = async () => {
  if (!selectedFileProducts.value) return;
  statusProducts.value = 'loading';
  errorMessageProducts.value = '';

  try {
    await importProducts(selectedFileProducts.value);
    statusProducts.value = 'success';
  } catch (error: any) {
    statusProducts.value = 'error';
    errorMessageProducts.value = error.message || 'Erreur lors de l\'importation des produits';
    console.error(error);
  }
};

const startImportCombinations = async () => {
  if (!selectedFileCombinations.value) return;
  statusCombinations.value = 'loading';
  errorMessageCombinations.value = '';

  try {
    await importCombinationsAndStocks(selectedFileCombinations.value);
    statusCombinations.value = 'success';
  } catch (error: any) {
    statusCombinations.value = 'error';
    errorMessageCombinations.value = error.message || 'Erreur lors de l\'importation des combinaisons et stocks';
    console.error(error);
  }
};

const startImportOrders = async () => {
  if (!selectedFileOrders.value) return;
  statusOrders.value = 'loading';
  errorMessageOrders.value = '';

  try {
    await importOrders(selectedFileOrders.value);
    statusOrders.value = 'success';
  } catch (error: any) {
    statusOrders.value = 'error';
    errorMessageOrders.value = error.message || 'Erreur lors de l\'importation des commandes';
    console.error(error);
  }
};

// ── Computed : compteurs phase 1 ──────────────────────────────────────────────
const taxCount      = computed(() => taxRateMap?.size || 0);
const categoryCount = computed(() => categoryMap?.size || 0);
const productCount  = computed(() => productMap?.size || 0);

// ── Computed : compteurs phase 2 ──────────────────────────────────────────────
const attributeCount = computed(() => attributeMap?.size || 0);
const attributeValueCount = computed(() => {
  let count = 0;
  if (attributeValueMap) {
    attributeValueMap.forEach((valMap) => { count += valMap.size; });
  }
  return count;
});
const combinationCount = computed(() => combinationMap?.size || 0);

// ── Computed : compteurs phase 3 ──────────────────────────────────────────────
const customerCount = computed(() => customerMap?.size || 0);
const addressCount  = computed(() => addressMap?.size || 0);
const orderCount    = computed(() => orderCountMap?.size || 0);
</script>