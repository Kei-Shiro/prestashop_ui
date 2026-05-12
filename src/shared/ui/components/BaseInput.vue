<script setup lang="ts">
interface Props {
  modelValue: string | number;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="base-input">
    <label v-if="label" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      class="base-input__field"
      :class="{ 'base-input__field--error': error }"
      @input="handleInput"
    />
    <span v-if="error" class="base-input__error">{{ error }}</span>
  </div>
</template>

<style scoped>
@import '../styles/tokens.css';

.base-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-input__label {
  font-family: var(--font-main);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-main);
}

.base-input__required {
  color: var(--color-danger);
  margin-left: 2px;
}

.base-input__field {
  font-family: var(--font-main);
  font-size: 0.875rem;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background-color: var(--color-surface);
  color: var(--color-text-main);
  transition: var(--transition-fast);
  outline: none;
}

.base-input__field::placeholder {
  color: var(--color-text-muted);
}

.base-input__field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.base-input__field--error {
  border-color: var(--color-danger);
}

.base-input__field--error:focus {
  box-shadow: 0 0 0 2px rgba(176, 0, 32, 0.1);
}

.base-input__error {
  font-family: var(--font-main);
  font-size: 0.75rem;
  color: var(--color-danger);
}
</style>