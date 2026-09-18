import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve('src/renderer'),
  plugins: [react()],
  resolve: { alias: { '@': resolve('src') } },
  build: { outDir: resolve('dist/renderer'), emptyOutDir: true }
})
