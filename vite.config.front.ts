import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'dist/frontoffice',
        rollupOptions: {
            input: resolve(__dirname, 'index.front.html'),
        },
    },
    resolve: {
        alias: {
            '@front': resolve(__dirname, 'src/frontoffice'),
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
    envPrefix: ['VITE_', 'FRONT_'],
})