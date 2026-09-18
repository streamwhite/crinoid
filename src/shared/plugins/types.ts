export type PluginCapability = 'filesystem' | 'shell' | 'notifications' | 'network'

export interface PluginContext { capabilities: ReadonlySet<PluginCapability> }
export interface DesktopPlugin { id: string; name: string; capabilities?: readonly PluginCapability[]; initialize?(context: PluginContext): void | Promise<void>; dispose?(): void | Promise<void> }
