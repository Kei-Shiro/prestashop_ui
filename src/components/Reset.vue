<script setup lang="ts">
import { ref } from 'vue'
import resetService from "../services/reset-service";

const loading = ref(false)
const message = ref('')
const error = ref('')

async function reset() {
    loading.value = true
    message.value = ''
    error.value = ''
    
    try {
        await resetService.resetAll()
        message.value = 'Reset successful!'
    } catch (e: any) {
        error.value = 'Reset failed: ' + (e.message || 'Unknown error')
        console.error('Reset error:', e)
    } finally {
        loading.value = false
    }
}
</script>

<template>
  <form @submit.prevent="reset">
    <button type="submit" :disabled="loading">
      {{ loading ? 'Resetting...' : 'Reset' }}
    </button>
    <p v-if="message" style="color: green">{{ message }}</p>
    <p v-if="error" style="color: red">{{ error }}</p>
  </form>
</template>

<style scoped>

</style>