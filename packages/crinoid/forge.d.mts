export interface ForgeConfigInput {
  packagerConfig?: Record<string, unknown>
  rebuildConfig?: Record<string, unknown>
  makers?: unknown[]
  plugins?: unknown[]
  publishers?: unknown[]
}

export interface ForgeConfig {
  packagerConfig: Record<string, unknown>
  rebuildConfig: Record<string, unknown>
  makers: unknown[]
  plugins: unknown[]
  publishers: unknown[]
}

export declare function securePackagerConfig(overrides?: Record<string, unknown>): Record<string, unknown>
export declare function createForgeConfig(config: ForgeConfigInput): ForgeConfig
