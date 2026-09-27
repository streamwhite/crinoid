import { createStore } from './reactive.js'
import type { Storage } from './storage.js'

const DEFAULT_KEY = 'settings'
const DEFAULT_VERSION = 1

export interface SettingsOptions<T extends object> {
  readonly storage: Storage<unknown>
  readonly defaults: T
  readonly key?: string
  readonly version?: number
  readonly migrate?: ((raw: unknown, fromVersion: number) => T) | undefined
}

export interface Settings<T extends object> {
  all(): T
  get<K extends keyof T>(key: K): T[K]
  set<K extends keyof T>(key: K, value: T[K]): void
  update(updater: (value: T) => T): void
  reset(): Promise<void>
  version(): number
  flush(): Promise<void>
  subscribe(listener: (value: T, previous: T) => void): () => void
}

export async function createSettings<T extends object>(options: SettingsOptions<T>): Promise<Settings<T>> {
  const key = options.key ?? DEFAULT_KEY
  const version = options.version ?? DEFAULT_VERSION
  const persisted = await options.storage.get(key)
  const store = createStore(resolveInitial(persisted, options, version))
  let queue: Promise<void> = Promise.resolve()

  const persist = (): void => {
    queue = queue.then(() => options.storage.set(key, { version, data: store.get() })).catch(() => {})
  }
  store.subscribe(() => persist())

  return {
    all: store.get,
    subscribe: store.subscribe,
    get: (name) => store.get()[name],
    set: (name, value) => store.set({ ...store.get(), [name]: value } as T),
    update: store.update,
    reset: async () => {
      store.set(options.defaults)
      await queue
    },
    version: () => version,
    flush: () => queue
  }
}

function resolveInitial<T extends object>(raw: unknown, options: SettingsOptions<T>, version: number): T {
  if (!isRecord(raw)) return options.defaults
  const envelope = isRecord(raw.data) && typeof raw.version === 'number' ? raw : null
  const source: unknown = envelope ? envelope.data : raw
  const fromVersion = envelope ? (envelope.version as number) : version
  const migrated = options.migrate !== undefined && fromVersion < version ? options.migrate(source, fromVersion) : undefined
  const values = migrated ?? source
  return isRecord(values) ? ({ ...options.defaults, ...values } as T) : options.defaults
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
