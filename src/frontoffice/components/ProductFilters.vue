<template>
  <div class="bg-gray-100 p-4 rounded mb-6">
    <div class="grid md:grid-cols-4 gap-4">
      <input
          v-model="localFilters.name"
          type="text"
          placeholder="Nom du produit"
          class="border p-2 rounded"
          @input="emitFilters"
      />
      <select v-model="localFilters.category" class="border p-2 rounded" @change="emitFilters">
        <option value="">Toutes catégories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <div class="flex gap-2">
        <input
            v-model.number="localFilters.priceMin"
            type="number"
            placeholder="Prix min"
            class="border p-2 rounded w-1/2"
            @input="emitFilters"
        />
        <input
            v-model.number="localFilters.priceMax"
            type="number"
            placeholder="Prix max"
            class="border p-2 rounded w-1/2"
            @input="emitFilters"
        />
      </div>
      <button @click="resetFilters" class="bg-gray-300 px-4 rounded">Réinitialiser</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import { useProduct } from '@shared/composables/useProduct';

const { products } = useProduct();
const categories = ref<string[]>([]);

onMounted(() => {
  categories.value = [...new Set(products.value.map(p => p.category).filter(Boolean))];
});

const localFilters = reactive({
  name: '',
  category: '',
  priceMin: null as number | null,
  priceMax: null as number | null
});

const emit = defineEmits(['filter']);

const emitFilters = () => {
  emit('filter', { ...localFilters });
};

const resetFilters = () => {
  localFilters.name = '';
  localFilters.category = '';
  localFilters.priceMin = null;
  localFilters.priceMax = null;
  emitFilters();
};
</script>