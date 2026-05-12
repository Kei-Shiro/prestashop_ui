<template>
  <div
    class="drop-zone"
    :class="{ 'drag-over': isDragOver }"
    @dragover.prevent="isDragOver = true"
    @dragleave.prevent="isDragOver = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".csv,.zip"
      multiple
      hidden
      @change="handleFileSelect"
    />
    <div class="drop-zone-content">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p class="drop-zone-text">Déposez vos fichiers CSV ou ZIP ici</p>
      <button type="button" class="drop-zone-button">Cliquer pour sélectionner</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  files: [files: File[]];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

function triggerFileInput(): void {
  fileInput.value?.click();
}

function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit('files', Array.from(target.files));
    target.value = '';
  }
}

function handleDrop(event: DragEvent): void {
  isDragOver.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    emit('files', Array.from(files));
  }
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: 0.75rem;
  padding: var(--space-8) var(--space-6);
  text-align: center;
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  background-color: var(--color-surface);
}

.drop-zone:hover {
  border-color: var(--color-accent);
}

.drop-zone.drag-over {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
  border-style: solid;
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-muted);
}

.drop-zone-text {
  font-family: var(--font-main);
  font-size: 1rem;
  color: var(--color-text-main);
  margin: 0;
}

.drop-zone-button {
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-surface);
  background-color: var(--color-accent);
  border: none;
  border-radius: 0.375rem;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.drop-zone-button:hover {
  opacity: 0.9;
}
</style>