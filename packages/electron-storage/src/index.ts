export interface Storage<T> { get(key: string): Promise<T | null>; set(key: string, value: T): Promise<void>; remove(key: string): Promise<void> }
export function createMemoryStorage<T>(): Storage<T> { const values = new Map<string, T>(); return { get: async (key) => values.get(key) ?? null, set: async (key, value) => { values.set(key, value) }, remove: async (key) => { values.delete(key) } } }
