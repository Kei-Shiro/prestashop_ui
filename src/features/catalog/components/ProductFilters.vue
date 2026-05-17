<template>
  <div class="filters-swiss">
    <div class="filter-row">
      <div class="filter-item search-box">
        <label class="f-label">Search</label>
        <input
            v-model="localFilters.name"
            type="text"
            placeholder="Product name..."
            class="s-input"
            @input="emitFilters"
        />
      </div>
      
      <div class="filter-item">
        <label class="f-label">Category</label>
        <select v-model="localFilters.category" class="s-select" @change="emitFilters">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="filter-item">
        <label class="f-label">Price Range</label>
        <div class="price-inputs">
          <input 
            v-model.number="localFilters.priceMin" 
            type="number" 
            placeholder="Min" 
            class="s-input price-s" 
            @input="emitFilters" 
          />
          <span class="price-sep">&mdash;</span>
          <input 
            v-model.number="localFilters.priceMax" 
            type="number" 
            placeholder="Max" 
            class="s-input price-s" 
            @input="emitFilters" 
          />
        </div>
      </div>
      
      <div class="filter-actions">
        <button @click="resetFilters" class="btn-clear">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import productService from '@features/catalog/services/product-service';

const categories = ref<{id: string, name: string}[]>([]);

onMounted(async () => {
  categories.value = await productService.getCategories();
});

const localFilters = reactive({ 
  name: '', 
  category: '', 
  priceMin: null as number | null, 
  priceMax: null as number | null 
});

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
.filters-swiss {
  border-top: 1px solid #eeeeee;
  border-bottom: 1px solid #eeeeee;
  padding: 2rem 0;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 3rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.f-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #999;
  font-weight: 600;
}

.s-input, .s-select {
  border: none;
  border-bottom: 1px solid #dddddd;
  background: transparent;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  color: #111;
}

.s-input:focus, .s-select:focus {
  border-color: #111;
}

.search-box {
  flex-grow: 1;
  max-width: 300px;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.price-s {
  width: 70px;
}

.price-sep {
  color: #ccc;
  font-size: 0.8rem;
}

.btn-clear {
  background: none;
  border: none;
  font-size: 0.8rem;
  color: #888;
  cursor: pointer;
  padding: 0.5rem 0;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.2s;
}

.btn-clear:hover {
  color: #111;
}

@media (max-width: 768px) {
  .filter-row { gap: 1.5rem; }
  .search-box { max-width: none; width: 100%; }
}
</style>