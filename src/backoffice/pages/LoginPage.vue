<template>
  <div class="login">
    <h1>Login Admin</h1>
    <button @click="login">Login</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();

const login = () => {
    localStorage.setItem('admin_token', 'temp-token');
    router.push('/');
}
</script>
