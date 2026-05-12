<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
});

const sizeClass = computed(() => `loading-spinner--${props.size}`);
</script>

<template>
  <div :class="['loading-spinner', sizeClass]">
    <div class="loading-spinner__circle"></div>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner__circle {
  border-radius: 50%;
  border-style: solid;
  border-color: currentColor;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.loading-spinner--sm .loading-spinner__circle {
  width: 14px;
  height: 14px;
  border-width: 2px;
}

.loading-spinner--md .loading-spinner__circle {
  width: 20px;
  height: 20px;
  border-width: 2.5px;
}

.loading-spinner--lg .loading-spinner__circle {
  width: 28px;
  height: 28px;
  border-width: 3px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>