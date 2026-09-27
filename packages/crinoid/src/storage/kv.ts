import type { Storage } from './memory.js'

export interface KeyValueStorage<T> {
  get(key: string): Promise<T | null>
  set(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  keys(): Promise<string[]>
}

const SEPARATOR = ':'

export function createKeyValueStorage<T>(backing: Storage<T>, namespace: string): KeyValueStorage<T> {
  const prefix = `${namespace}${SEPARATOR}`
  const qualified = (key: string): string => `${prefix}${key}`
  const unqualified = (key: string): string => key.slice(prefix.length)

  return {
    get: (key) => backing.get(qualified(key)),
    set: (key, value) => backing.set(qualified(key), value),
    remove: (key) => backing.remove(qualified(key)),
    keys: async () => {
      if (!backing.keys) return []
      const keys = await backing.keys()
      return keys.filter((key: string) => key.startsWith(prefix)).map(unqualified)
    }
  }
}
