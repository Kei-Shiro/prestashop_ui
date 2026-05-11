<script setup lang="ts">
import type { ImportItem } from '@shared/services/import-service';

const props = defineProps<{
  item: ImportItem;
  index: number;
  options: { value: string, label: string }[];
  showRemove: boolean;
}>();

const emit = defineEmits<{
  (e: 'remove', id: number): void;
  (e: 'update:endpoint', value: string): void;
  (e: 'file-select', item: ImportItem, event: Event): void;
}>();

const handleFile = (event: Event) => {
  emit('file-select', props.item, event);
};

const handleRemove = () => {
  emit('remove', props.item.id);
};
</script>

<template>
  <div class="import-row">
    <div class="form-group file-group">
      <label class="form-label">Fichier {{ index + 1 }}</label>
      <div class="file-input-wrapper">
        <input 
          type="file" 
          class="file-input" 
          @change="handleFile"
        >
        <div class="file-custom" :class="{ 'has-file': item.file }">
          <span class="file-name">{{ item.file ? item.file.name : 'Choisir un fichier...' }}</span>
          <span class="file-btn">Parcourir</span>
        </div>
      </div>
    </div>

    <div class="form-group endpoint-group">
      <label class="form-label">Endpoint de destination</label>
      <select 
        :value="item.endpoint" 
        @input="$emit('update:endpoint', ($event.target as HTMLSelectElement).value)" 
        class="form-select"
      >
        <option value="" disabled>Sélectionnez un endpoint</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <button 
      type="button" 
      class="btn-remove" 
      @click="handleRemove"
      title="Supprimer cette ligne"
      v-if="showRemove"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
    <div v-else class="btn-remove-placeholder"></div>
  </div>
</template>

<style scoped>
.import-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-group {
  flex: 1;
}

.endpoint-group {
  flex: 1;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

/* File Input Customization */
.file-input-wrapper {
  position: relative;
  height: 2.5rem;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.file-custom {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  overflow: hidden;
  transition: var(--transition-fast);
  z-index: 1;
}

.file-input:hover + .file-custom {
  border-color: var(--accent-primary);
}

.file-input:focus + .file-custom {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  border-color: var(--accent-primary);
}

.file-name {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-custom.has-file .file-name {
  color: var(--text-main);
  font-weight: 500;
}

.file-btn {
  background: var(--bg-color);
  border-left: 1px solid var(--border-color);
  height: 100%;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-main);
}

/* Select Customization */
.form-select {
  height: 2.5rem;
  padding: 0 1rem;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-family: var(--font-main);
  font-size: 0.875rem;
  color: var(--text-main);
  outline: none;
  transition: var(--transition-fast);
  cursor: pointer;
}

.form-select:hover {
  border-color: var(--accent-primary);
}

.form-select:focus {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  border-color: var(--accent-primary);
}

/* Remove Button */
.btn-remove {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-remove:hover {
  background: #fee2e2;
  color: var(--accent-danger);
  border-color: #fca5a5;
}

.btn-remove svg {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-remove-placeholder {
  width: 2.5rem;
  height: 2.5rem;
}
</style>
