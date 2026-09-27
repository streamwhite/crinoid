export interface CacheOptions {
  readonly ttlMs: number
  readonly now?: (() => number) | undefined
}

export interface Cache<T> {
  get(key: string, loader: () => Promise<T>): Promise<T>
  set(key: string, value: T): Promise<void>
  peek(key: string): Promise<T | null>
  invalidate(key: string): void
  clear(): void
}

interface Entry<T> {
  readonly value: T
  readonly expiresAt: number
}

export function createCache<T>(options: CacheOptions): Cache<T> {
  const now = options.now ?? (() => Date.now())
  const entries = new Map<string, Entry<T>>()
  const pending = new Map<string, Promise<T>>()

  const read = (key: string): T | null => {
    const entry = entries.get(key)
    if (!entry) return null
    if (entry.expiresAt <= now()) {
      entries.delete(key)
      return null
    }
    return entry.value
  }

  return {
    get: async (key, loader) => {
      const cached = read(key)
      if (cached !== null) return cached
      const inFlight = pending.get(key)
      if (inFlight) return inFlight
      const promise = loader()
        .then((value) => {
          entries.set(key, { value, expiresAt: now() + options.ttlMs })
          return value
        })
        .finally(() => pending.delete(key))
      pending.set(key, promise)
      return promise
    },
    set: async (key, value) => {
      entries.set(key, { value, expiresAt: now() + options.ttlMs })
    },
    peek: async (key) => read(key),
    invalidate: (key) => {
      entries.delete(key)
    },
    clear: () => entries.clear()
  }
}
