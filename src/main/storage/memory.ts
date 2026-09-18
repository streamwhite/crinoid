import type { Storage } from './types'

export function createMemoryStorage<T>(): Storage<T> {
  const values = new Map<string, T>()
  return { get: async (key) => values.get(key) ?? null, set: async (key, value) => { values.set(key, value) }, remove: async (key) => { values.delete(key) } }
}
