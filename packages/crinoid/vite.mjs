export function createMainViteConfig(entry, alias = {}) {
  return {
    build: {
      lib: { entry, fileName: () => 'main.js', formats: ['cjs'] },
      rollupOptions: { external: ['electron'] }
    },
    resolve: { alias }
  }
}

export function createPreloadViteConfig(entry, alias = {}) {
  return {
    build: {
      lib: { entry, fileName: () => 'preload.js', formats: ['cjs'] },
      rollupOptions: { external: ['electron'] }
    },
    resolve: { alias }
  }
}

export function createRendererViteConfig({ root, plugins = [], alias = {}, outDir }) {
  return {
    root,
    plugins,
    resolve: { alias },
    ...(outDir ? { build: { outDir, emptyOutDir: true } } : {})
  }
}
