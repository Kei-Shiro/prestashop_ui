<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md',
});

const classes = computed(() => [
  'base-badge',
  `base-badge--${props.variant}`,
  `base-badge--${props.size}`,
]);
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>

<style scoped>
@import '../styles/tokens.css';

.base-badge {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-main);
  font-weight: 500;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Sizes */
.base-badge--sm {
  padding: var(--space-1) var(--space-2);
  font-size: 0.6875rem;
}

.base-badge--md {
  padding: var(--space-1) var(--space-3);
  font-size: 0.75rem;
}

/* Variants */
.base-badge--success {
  background-color: #dcfce7;
  color: #166534;
}

.base-badge--warning {
  background-color: #fef3c7;
  color: #92400e;
}

.base-badge--danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.base-badge--info {
  background-color: var(--color-accent-light);
  color: var(--color-primary);
}

.base-badge--neutral {
  background-color: var(--color-bg);
  color: var(--color-text-muted);
}
</style>