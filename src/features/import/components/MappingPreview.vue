<template>
  <div class="mapping-preview">
    <div class="mapping-header">
      <span class="mapping-title">Correspondance des colonnes</span>
    </div>
    <div class="mapping-table">
      <table>
        <thead>
          <tr>
            <th>Colonne source</th>
            <th>Colonne PrestaShop</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(target, source) in columnMappings" :key="source">
            <td class="source-col">{{ source }}</td>
            <td class="target-col">
              <span class="target-badge">{{ target }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { EntityType } from '../types/import.types';
import { getColumnMappings, loadMappingConfig } from '../services/mapping-loader.service';

const props = defineProps<{
  entity: EntityType | 'unknown';
  headers: string[];
}>();

const columnMappings = ref<Record<string, string>>({});

onMounted(async () => {
  if (props.entity === 'unknown') return;
  
  const config = await loadMappingConfig();
  columnMappings.value = getColumnMappings(props.entity, config);
});
</script>

<style scoped>
.mapping-preview {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
}

.mapping-header {
  margin-bottom: 0.5rem;
}

.mapping-title {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.mapping-table {
  overflow-x: auto;
}

.mapping-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.mapping-table th,
.mapping-table td {
  padding: 0.375rem 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.mapping-table th {
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
}

.source-col {
  font-family: monospace;
  color: #334155;
}

.target-col {
  font-family: monospace;
}

.target-badge {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
}
</style>
