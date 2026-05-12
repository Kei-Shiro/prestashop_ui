<script setup lang="ts">
import { computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const classes = computed(() => [
  'base-button',
  `base-button--${props.variant}`,
  `base-button--${props.size}`,
  {
    'base-button--disabled': props.disabled,
    'base-button--loading': props.loading,
  },
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <button
    :class="classes"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <LoadingSpinner v-if="loading" :size="size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'" />
    <span v-else class="base-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
@import '../styles/tokens.css';

.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-main);
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: var(--transition-fast);
  border: none;
  outline: none;
}

.base-button:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent-light), 0 0 0 4px var(--color-primary);
}

/* Sizes */
.base-button--sm {
  padding: var(--space-2) var(--space-3);
  font-size: 0.8125rem;
}

.base-button--md {
  padding: var(--space-3) var(--space-6);
  font-size: 0.875rem;
}

.base-button--lg {
  padding: var(--space-4) var(--space-8);
  font-size: 1rem;
}

/* Variants */
.base-button--primary {
  background-color: var(--color-primary);
  color: white;
}

.base-button--primary:hover:not(:disabled) {
  background-color: #1e293b;
}

.base-button--secondary {
  background-color: var(--color-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}

.base-button--secondary:hover:not(:disabled) {
  background-color: var(--color-bg);
  border-color: var(--color-text-muted);
}

.base-button--outline {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.base-button--outline:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.base-button--danger {
  background-color: var(--color-danger);
  color: white;
}

.base-button--danger:hover:not(:disabled) {
  background-color: #9b0020;
}

/* States */
.base-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button--loading {
  cursor: wait;
}

.base-button__content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
</style>