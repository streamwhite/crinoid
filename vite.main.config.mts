import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({ build: { lib: { entry: resolve('src/main/index.ts'), fileName: () => 'main.js', formats: ['cjs'] }, rollupOptions: { external: ['electron'] } }, resolve: { alias: { '@': resolve('src') } } })
