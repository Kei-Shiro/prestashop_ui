<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: 'paid' | 'failed' | 'canceled';
  label: string;
}>();

const statusClass = computed(() => `status-badge ${props.status}`);
</script>

<template>
  <span :class="statusClass">
    <span class="status-dot"></span>
    {{ label }}
  </span>
</template>

<style scoped>
/* Professional Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
}

.status-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
}

.status-badge.paid {
  background-color: #ecfdf5;
  color: #065f46;
}
.status-badge.paid .status-dot {
  background-color: #10b981;
}

.status-badge.failed {
  background-color: #fef2f2;
  color: #991b1b;
}
.status-badge.failed .status-dot {
  background-color: #ef4444;
}

.status-badge.canceled {
  background-color: #f1f5f9;
  color: #475569;
}
.status-badge.canceled .status-dot {
  background-color: #64748b;
}
</style>
