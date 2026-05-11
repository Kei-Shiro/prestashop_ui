import { ref } from 'vue';

export function useAuth() {
  const isAuthenticated = ref(false);

  const login = () => {
    isAuthenticated.value = true;
  };

  const logout = () => {
    isAuthenticated.value = false;
  };

  return { isAuthenticated, login, logout };
}

/*import { computed } from 'vue'
import { useAuthStore } from '@back/stores/auth'

export function useAuth() {
  const store = useAuthStore()

  return {
    isAuthenticated: computed(() => !!store.token),
    currentUser: computed(() => store.user),
    login: store.login,
    logout: store.logout,
  }
}*/