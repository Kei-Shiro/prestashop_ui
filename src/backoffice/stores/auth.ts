import { createPinia, defineStore } from 'pinia';
import type { AuthState } from '@shared/types/auth';

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
  }),
  actions: {
    login(token: string) {
      this.token = token;
      this.isAuthenticated = true;
    },
    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
    }
  }
});

