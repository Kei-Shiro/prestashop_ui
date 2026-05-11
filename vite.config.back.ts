import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    root: '.',
    build: {
        outDir: 'dist/backoffice',
        rollupOptions: {
            input: resolve(__dirname, 'index.back.html'),
        },
    },
    resolve: {
        alias: {
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
    envPrefix: ['VITE_', 'BACK_'],
})