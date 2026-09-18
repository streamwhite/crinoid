export interface CapabilityContext { readonly capabilities: ReadonlySet<string> }
export interface RuntimeModule { readonly id: string; initialize?(context: CapabilityContext): void | Promise<void>; dispose?(): void | Promise<void> }

export function createModuleRuntime(modules: readonly RuntimeModule[] = []) { return { initialize: async (capabilities: ReadonlySet<string>) => { for (const module of modules) await module.initialize?.({ capabilities }) }, dispose: async () => { for (const module of modules) await module.dispose?.() } } }
