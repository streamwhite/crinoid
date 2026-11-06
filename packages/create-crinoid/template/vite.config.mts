import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createRendererViteConfig } from 'crinoid/vite'

export default createRendererViteConfig({
  root: 'src/renderer',
  plugins: [react(), tailwindcss()]
})
