export type ViteAlias = Record<string, string>

export interface RendererViteOptions {
  root: string
  plugins?: unknown[]
  alias?: ViteAlias
  outDir?: string
}

export declare function createMainViteConfig(entry: string, alias?: ViteAlias): Record<string, unknown>
export declare function createPreloadViteConfig(entry: string, alias?: ViteAlias): Record<string, unknown>
export declare function createRendererViteConfig(options: RendererViteOptions): Record<string, unknown>
