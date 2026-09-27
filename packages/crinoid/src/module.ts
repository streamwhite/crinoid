export interface CapabilityContext {
  readonly capabilities: ReadonlySet<string>
}

export interface RuntimeModule {
  readonly id: string
  initialize?(context: CapabilityContext): void | Promise<void>
  dispose?(): void | Promise<void>
}

export interface ModuleRuntime {
  initialize(capabilities: ReadonlySet<string>): Promise<void>
  dispose(): Promise<void>
}

// modules initialize in declaration order: later modules may depend on earlier ones
export function createModuleRuntime(modules: readonly RuntimeModule[] = []): ModuleRuntime {
  return {
    initialize: async (capabilities) => {
      for (const module of modules) await module.initialize?.({ capabilities })
    },
    dispose: async () => {
      for (const module of modules) await module.dispose?.()
    }
  }
}
