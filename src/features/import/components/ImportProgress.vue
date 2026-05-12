<template>
  <div class="import-progress">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${percentage}%` }" />
    </div>
    <div class="progress-steps">
      <div
        v-for="step in steps"
        :key="step.entity"
        class="step"
        :class="step.status"
      >
        <span class="step-icon">
          <template v-if="step.status === 'success'">✓</template>
          <template v-else-if="step.status === 'in_progress'">◔</template>
          <template v-else-if="step.status === 'error'">✗</template>
          <template v-else>○</template>
        </span>
        <span class="step-name">{{ step.entity }}</span>
        <span class="step-count">{{ step.imported }}/{{ step.imported + step.failed }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ImportDetail } from '@features/import/types/import.types';

defineProps<{
  steps: ImportDetail[];
  percentage: number;
}>();
</script>

<style scoped>
.import-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  font-family: var(--font-main);
}

.progress-bar {
  height: 8px;
  background-color: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--color-accent);
  transition: width var(--transition-base);
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.step.success {
  background-color: rgba(27, 94, 32, 0.1);
}

.step.error {
  background-color: rgba(176, 0, 32, 0.1);
}

.step.in_progress {
  background-color: var(--color-accent-light);
}

.step.pending,
.step.skipped {
  background-color: var(--color-bg);
}

.step-icon {
  width: 20px;
  text-align: center;
  font-weight: 600;
}

.step.success .step-icon {
  color: var(--color-success);
}

.step.error .step-icon {
  color: var(--color-danger);
}

.step.in_progress .step-icon {
  color: var(--color-accent);
}

.step.pending .step-icon,
.step.skipped .step-icon {
  color: var(--color-text-muted);
}

.step-name {
  flex: 1;
  color: var(--color-text-main);
  font-weight: 500;
}

.step-count {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
</style>