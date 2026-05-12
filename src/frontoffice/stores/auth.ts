import { defineStore } from 'pinia';
import { ref } from 'vue';
import { authFrontService } from '@shared/services/auth-front-service';
import { customerService } from '@shared/services/customer-service';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<any>(null);
    const isAuthenticated = ref(false);
    const isAnonymous = ref(false);

    // Connexion avec mot de passe (authentification réelle)
    const login = async (email: string, password: string): Promise<boolean> => {
        const success = await authFrontService.login(email, password);
        if (success) {
            const customer = await customerService.getCustomerByEmail(email);
            if (customer) {
                user.value = customer;
                isAuthenticated.value = true;
                isAnonymous.value = false;
                localStorage.setItem('user', JSON.stringify(customer));
                return true;
            }
        }
        return false;
    };

    // Connexion sans mot de passe (pour la sélection simplifiée)
    const loginWithoutPassword = (customer: any) => {
        user.value = customer;
        isAuthenticated.value = true;
        isAnonymous.value = false;
        localStorage.setItem('user', JSON.stringify(customer));
    };

    const loginAnonymous = () => {
        user.value = null;
        isAuthenticated.value = true;   // on considère qu'il est "connecté" en tant qu'anonyme
        isAnonymous.value = true;
        localStorage.removeItem('user');
    };

    const logout = async () => {
        if (!isAnonymous.value) {
            await authFrontService.logout();
        }
        user.value = null;
        isAuthenticated.value = false;
        isAnonymous.value = false;
        localStorage.removeItem('user');
    };

    const restoreSession = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            user.value = JSON.parse(stored);
            isAuthenticated.value = true;
            isAnonymous.value = false;
        } else {
            // Pas de session restaurée
        }
    };

    return { user, isAuthenticated, isAnonymous, login, loginWithoutPassword, loginAnonymous, logout, restoreSession };
});