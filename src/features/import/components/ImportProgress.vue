<template>
  <div class="import-progress">
    <!-- Barre de progression globale -->
    <div class="progress-header">
      <span class="progress-label">{{ currentPhaseLabel }}</span>
      <span class="progress-percent">{{ percentage }}%</span>
    </div>
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${percentage}%` }"
        :class="progressClass"
      />
    </div>

    <!-- Détails par entité -->
    <div class="progress-steps">
      <div
        v-for="step in steps"
        :key="step.entity"
        class="step"
        :class="step.status"
      >
        <span class="step-icon">
          <template v-if="step.status === 'success'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="step-svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </template>
          <template v-else-if="step.status === 'in_progress'">
            <div class="spinner-small" />
          </template>
          <template v-else-if="step.status === 'error'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="step-svg">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </template>
          <template v-else>
            <div class="step-dot" />
          </template>
        </span>

        <div class="step-info">
          <span class="step-name">{{ entityLabel(step.entity) }}</span>
          <span class="step-detail">
            <template v-if="step.status === 'in_progress' && step.total > 0">
              {{ step.imported + step.failed }} / {{ step.total }}
            </template>
            <template v-else-if="step.status === 'success' || step.status === 'error'">
              {{ step.imported }} importé{{ step.imported > 1 ? 's' : '' }}
              <template v-if="step.failed > 0">
                · <span class="text-danger">{{ step.failed }} échoué{{ step.failed > 1 ? 's' : '' }}</span>
              </template>
            </template>
            <template v-else>
              En attente
            </template>
          </span>
        </div>

        <!-- Mini barre de progression par entité -->
        <div v-if="step.status === 'in_progress' && step.total > 0" class="step-progress-bar">
          <div
            class="step-progress-fill"
            :style="{ width: `${Math.round(((step.imported + step.failed) / step.total) * 100)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ImportDetail } from '@features/import/types/import.types';

const props = defineProps<{
  steps: ImportDetail[];
  percentage: number;
  phase?: string;
}>();

const ENTITY_LABELS: Record<string, string> = {
  category: 'Catégories',
  product: 'Produits',
  images: 'Images',
  combination: 'Combinaisons',
  customer: 'Clients',
  address: 'Adresses',
  order: 'Commandes',
  system: 'Système',
};

function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] || entity;
}

const currentPhaseLabel = computed(() => {
  const phaseLabels: Record<string, string> = {
    parsing: 'Analyse des fichiers…',
    mapping: 'Mapping des données…',
    importing: 'Importation en cours…',
    images: 'Upload des images…',
    complete: 'Import terminé !',
    error: 'Erreur lors de l\'import',
  };
  return phaseLabels[props.phase || ''] || 'Traitement…';
});

const progressClass = computed(() => {
  if (props.phase === 'error') return 'error';
  if (props.phase === 'complete') return 'complete';
  return 'active';
});
</script>

<style scoped>
.import-progress {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-family: var(--font-main, 'Inter', sans-serif);
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: var(--bg-color, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 0.625rem;
}

/* ── Header ── */
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-main, #1e293b);
}

.progress-percent {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--accent-primary, #3b82f6);
  font-variant-numeric: tabular-nums;
}

/* ── Progress Bar ── */
.progress-bar {
  height: 6px;
  background-color: var(--border-color, #e2e8f0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill.active {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  animation: shimmer 2s infinite;
}

.progress-fill.complete {
  background: linear-gradient(90deg, #22c55e, #4ade80);
}

.progress-fill.error {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.8; }
  100% { opacity: 1; }
}

/* ── Steps ── */
.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  transition: background-color 0.2s ease;
}

.step.success {
  background-color: rgba(34, 197, 94, 0.08);
}

.step.error {
  background-color: rgba(239, 68, 68, 0.08);
}

.step.in_progress {
  background-color: rgba(59, 130, 246, 0.08);
}

.step.pending,
.step.skipped {
  background-color: transparent;
  opacity: 0.5;
}

/* ── Step Icon ── */
.step-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-svg {
  width: 1rem;
  height: 1rem;
}

.step.success .step-svg { color: #22c55e; }
.step.error .step-svg { color: #ef4444; }

.step-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--border-hover, #cbd5e1);
}

.spinner-small {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Step Info ── */
.step-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.step-name {
  font-weight: 600;
  color: var(--text-main, #1e293b);
  font-size: 0.8125rem;
}

.step-detail {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
}

.text-danger {
  color: #ef4444;
  font-weight: 600;
}

/* ── Step Mini Progress ── */
.step-progress-bar {
  width: 4rem;
  height: 3px;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 2px;
  overflow: hidden;
  flex-shrink: 0;
}

.step-progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>