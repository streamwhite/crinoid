import { createPersistentStore } from './persistent.js'
import type { Storage } from './storage.js'

const PREFERENCES_KEY = 'preferences'

export interface PreferencesOptions<T extends object> {
  readonly storage: Storage<T>
  readonly defaults: T
  readonly key?: string
}

export type PreferenceListener<T extends object> = (key: keyof T, value: T[keyof T]) => void

export interface Preferences<T extends object> {
  get<K extends keyof T>(key: K): T[K]
  all(): T
  set<K extends keyof T>(key: K, value: T[K]): void
  update(updater: (value: T) => T): void
  reset(): Promise<void>
  subscribe(listener: PreferenceListener<T>): () => void
  flush(): Promise<void>
}

export async function createPreferences<T extends object>(options: PreferencesOptions<T>): Promise<Preferences<T>> {
  const key = options.key ?? PREFERENCES_KEY
  const store = await createPersistentStore<T>({ storage: options.storage, key, defaults: options.defaults })
  const listeners = new Set<PreferenceListener<T>>()

  return {
    get: (name) => store.get()[name],
    all: store.get,
    set: (name, value) => {
      store.set({ ...store.get(), [name]: value })
      for (const listener of [...listeners]) listener(name, value)
    },
    update: store.update,
    reset: async () => {
      store.set(options.defaults)
      await store.flush()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    flush: store.flush
  }
}
