<script setup lang="ts">
interface Option {
  value: string | number;
  label: string;
}

interface Props {
  modelValue: string | number;
  options: Option[];
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="base-select">
    <label v-if="label" class="base-select__label">
      {{ label }}
      <span v-if="required" class="base-select__required">*</span>
    </label>
    <select
      :value="modelValue"
      :required="required"
      class="base-select__field"
      :class="{ 'base-select__field--error': error }"
      @change="handleChange"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-if="error" class="base-select__error">{{ error }}</span>
  </div>
</template>

<style scoped>
@import '../styles/tokens.css';

.base-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-select__label {
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.base-select__required {
  color: var(--color-danger);
  margin-left: 2px;
}

.base-select__field {
  font-family: var(--font-main);
  font-size: 0.875rem;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  color: var(--color-text-main);
  transition: var(--transition-fast);
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--space-3) center;
  padding-right: var(--space-8);
}

.base-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.base-select__field--error {
  border-color: var(--color-danger);
}

.base-select__field--error:focus {
  box-shadow: 0 0 0 2px rgba(176, 0, 32, 0.1);
}

.base-select__error {
  font-family: var(--font-main);
  font-size: 0.75rem;
  color: var(--color-danger);
}
</style>