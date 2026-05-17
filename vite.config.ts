import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@front': resolve(__dirname, 'src/frontoffice'),
            '@back': resolve(__dirname, 'src/backoffice'),
            '@shared': resolve(__dirname, 'src/shared'),
            '@features': resolve(__dirname, 'src/features'),
        },
    },
    server: {
        proxy: {
            // Proxy pour l'API standard
            '/prestashop/api': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
            },
            // Proxy pour les modules (comme stockmvtapi)
            '/prestashop/module': {
                target: 'http://localhost',
                changeOrigin: true,
                secure: false,
            },
        }
    },
    envPrefix: ['VITE_', 'FRONT_', 'BACK_'],
})