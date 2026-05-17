import axios from 'axios';

const frontApi = axios.create({
    baseURL: 'http://localhost/prestashop',
    withCredentials: true,      // pour conserver le cookie de session
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

export const authFrontService = {
    async login(email: string, password: string): Promise<boolean> {
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', password);
        params.append('submitLogin', '1');

        try {
            const response = await frontApi.post('/connexion?back=my-account', params);
            const html = response.data;
            return html.includes('<title>Mon compte</title>') || html.includes('my-account');
        } catch {
            return false;
        }
    },

    async logout(): Promise<void> {
        try {
            await fetch('http://localhost/prestashop/?mylogout=', { mode: 'no-cors', credentials: 'include' });
        } catch (_) {}
    }
};