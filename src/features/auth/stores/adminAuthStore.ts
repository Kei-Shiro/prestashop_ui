import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@shared/types/user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('admin_token'));
  const isAuthenticated = ref<boolean>(!!token.value);

  function login(newToken: string) {
    token.value = newToken;
    isAuthenticated.value = true;
  }

  function logout() {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout
  };
});