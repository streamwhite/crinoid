import { VitePlugin } from '@electron-forge/plugin-vite'

export default { packagerConfig: { asar: true }, makers: [], plugins: [new VitePlugin({ build: [{ entry: 'src/main/index.ts', config: 'vite.main.config.mts' }], renderer: [{ name: 'main_window', config: 'vite.config.mts' }] })] }
