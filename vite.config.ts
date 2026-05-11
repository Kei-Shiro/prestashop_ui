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
        },
    },
    server: {
        proxy: {
            '/prestashop/api': {
                target: 'http://localhost',
                changeOrigin: true,
            }
        }
    },
    envPrefix: ['VITE_', 'FRONT_', 'BACK_'],
})
