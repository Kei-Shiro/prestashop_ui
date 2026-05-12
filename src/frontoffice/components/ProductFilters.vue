<template>
  <div class="filters">
    <div class="filters-grid">
      <input
          v-model="localFilters.name"
          type="text"
          placeholder="Nom du produit"
          class="filters-input"
          @input="emitFilters"
      />
      <select v-model="localFilters.category" class="filters-select" @change="emitFilters">
        <option value="">Toutes categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <div class="filters-price">
        <input v-model.number="localFilters.priceMin" type="number" placeholder="Prix min" class="filters-input" @input="emitFilters" />
        <input v-model.number="localFilters.priceMax" type="number" placeholder="Prix max" class="filters-input" @input="emitFilters" />
      </div>
      <button @click="resetFilters" class="filters-reset">Reinitialiser</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import productService from '@shared/services/product-service';

const categories = ref<{id: string, name: string}[]>([]);

onMounted(async () => {
  categories.value = await productService.getCategories();
});

const localFilters = reactive({ name: '', category: '', priceMin: null as number | null, priceMax: null as number | null });
const emit = defineEmits(['filter']);

const emitFilters = () => emit('filter', { ...localFilters });
const resetFilters = () => {
  localFilters.name = '';
  localFilters.category = '';
  localFilters.priceMin = null;
  localFilters.priceMax = null;
  emitFilters();
};
</script>

<style scoped>
.filters {
  background: #f1f5f9;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 24px;
}
.filters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: center;
}
@media (max-width: 768px) {
  .filters-grid { grid-template-columns: 1fr; }
}
.filters-input,
.filters-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  font-size: 0.875rem;
  color: #1e293b;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.filters-input:focus,
.filters-select:focus { border-color: #0f172a; }
.filters-price {
  display: flex;
  gap: 8px;
}
.filters-price .filters-input { width: 50%; }
.filters-reset {
  padding: 10px 20px;
  background: #cbd5e1;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.filters-reset:hover { background: #94a3b8; }
</style>