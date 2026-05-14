<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <header class="page-header">
    <h1 class="page-title">{{ title }}</h1>
    <p class="page-description">{{ description }}</p>
  </header>
</template>

<style scoped>
.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
  color: var(--color-text-main, #1e293b);
}

.page-description {
  color: var(--color-text-muted, #64748b);
  font-size: 0.95rem;
  margin-bottom: 2rem;
  font-weight: 400;
}
</style>