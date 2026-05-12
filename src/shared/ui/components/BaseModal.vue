<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';

interface Props {
  show: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const close = () => {
  emit('update:show', false);
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    close();
  }
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    close();
  }
};

watch(
  () => props.show,
  (value) => {
    if (value) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
);

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="base-modal__backdrop" @click="handleBackdropClick">
        <div class="base-modal" :class="`base-modal--${size}`">
          <div v-if="title" class="base-modal__header">
            <h2 class="base-modal__title">{{ title }}</h2>
            <button class="base-modal__close" @click="close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="base-modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '../styles/tokens.css';

.base-modal__backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.base-modal {
  background-color: var(--color-surface);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - var(--space-8));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.base-modal--sm {
  width: 100%;
  max-width: 24rem;
}

.base-modal--md {
  width: 100%;
  max-width: 32rem;
}

.base-modal--lg {
  width: 100%;
  max-width: 48rem;
}

.base-modal--xl {
  width: 100%;
  max-width: 64rem;
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.base-modal__title {
  font-family: var(--font-main);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin: 0;
}

.base-modal__close {
  background: none;
  border: none;
  padding: var(--space-2);
  cursor: pointer;
  color: var(--color-text-muted);
  border-radius: 0.25rem;
  transition: var(--transition-fast);
}

.base-modal__close:hover {
  background-color: var(--color-bg);
  color: var(--color-text-main);
}

.base-modal__body {
  padding: var(--space-6);
  overflow-y: auto;
}

.base-modal__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .base-modal,
.modal-leave-active .base-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .base-modal,
.modal-leave-to .base-modal {
  transform: scale(0.95);
}
</style>