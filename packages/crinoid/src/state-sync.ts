import type { ReadableStore } from './reactive.js'

export interface SyncWindowContents {
  send(channel: string, ...args: unknown[]): void
}

export interface SyncWindow {
  readonly webContents?: SyncWindowContents | undefined
}

export interface SyncRegistry<T extends SyncWindow = SyncWindow> {
  get(id: string): T | undefined
  ids(): readonly string[]
  broadcast(channel: string, ...args: unknown[]): number
}

export interface StateSyncOptions<T, W extends SyncWindow = SyncWindow> {
  readonly store: ReadableStore<T>
  readonly registry: SyncRegistry<W>
  readonly channel: string
  readonly encode?: ((value: T) => unknown) | undefined
}

export interface StateSync<T, W extends SyncWindow = SyncWindow> {
  emitTo(id: string): void
  emitAll(): void
  dispose(): void
}

export function createStateSync<T, W extends SyncWindow = SyncWindow>(options: StateSyncOptions<T, W>): StateSync<T, W> {
  const encode = options.encode ?? ((value: T) => value)
  const emit = (): void => {
    options.registry.broadcast(options.channel, encode(options.store.get()))
  }
  const unsubscribe = options.store.subscribe(emit)

  return {
    emitTo: (id) => {
      options.registry.get(id)?.webContents?.send(options.channel, encode(options.store.get()))
    },
    emitAll: emit,
    dispose: () => unsubscribe()
  }
}

export type StateListener<T> = (value: T, previous: T) => void
