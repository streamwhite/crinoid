import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({ build: { lib: { entry: resolve('src/preload/index.ts'), fileName: () => 'preload.js', formats: ['cjs'] }, rollupOptions: { external: ['electron'] } }, resolve: { alias: { '@': resolve('src') } } })
