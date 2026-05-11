// src/api/client.ts
import axios from 'axios'

const client = axios.create({
    baseURL: '/prestashop/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/xml' },
    auth: {
        username: import.meta.env.VITE_PS_API_KEY,
        password: ''
    },
})

client.interceptors.response.use(
    (r) => r,
    (err) => {
        // TODO : créer une route /login ou gérer le 401 dans l'UI
        // window.location.href = '/login' ← route inexistante, à ne pas activer
        console.error('Erreur API', err.response?.status)
        return Promise.reject(err)
    }
)

export default client