import type { DesktopPlugin, PluginCapability } from './types'

export function createPluginRegistry(plugins: readonly DesktopPlugin[] = []) {
  const registered = new Map<string, DesktopPlugin>()
  return {
    register: (plugin: DesktopPlugin) => { if (registered.has(plugin.id)) throw new Error(`Duplicate plugin: ${plugin.id}`); registered.set(plugin.id, plugin) },
    initialize: async () => { for (const plugin of registered.values()) await plugin.initialize?.({ capabilities: new Set<PluginCapability>(plugin.capabilities ?? []) }) },
    dispose: async () => { for (const plugin of registered.values()) await plugin.dispose?.() },
    plugins: () => [...registered.values()]
  }
}

export function registerPlugins(registry: ReturnType<typeof createPluginRegistry>, plugins: readonly DesktopPlugin[]): void { plugins.forEach((plugin) => registry.register(plugin)) }
