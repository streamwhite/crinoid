import { describe, expect, it, vi } from 'vitest'
import { createPersistentStore } from 'crinoid/persistent'
import type { Storage } from 'crinoid/storage'

function createStorage<T>(initial: Partial<T> | null = null) {
  let value = initial
  return {
    storage: {
      get: async () => value as T | null,
      set: async (_key: string, next: T) => {
        value = next
      },
      remove: async () => {
        value = null
      }
    } as Storage<T>,
    current: () => value
  }
}

describe('persistent store', () => {
  it('loads persisted state and merges with defaults', async () => {
    const { storage } = createStorage<{ theme: string; locale: string }>({ theme: 'dark' })

    const store = await createPersistentStore({ storage, key: 'prefs', defaults: { theme: 'light', locale: 'en' } })

    expect(store.get()).toEqual({ theme: 'dark', locale: 'en' })
  })

  it('persists changes through the storage', async () => {
    const { storage, current } = createStorage<{ theme: string; locale: string }>(null)
    const store = await createPersistentStore({ storage, key: 'prefs', defaults: { theme: 'light', locale: 'en' } })

    store.set({ theme: 'dark', locale: 'en' })
    await store.flush()

    expect(current()).toEqual({ theme: 'dark', locale: 'en' })
  })

  it('notifies subscribers on persisted changes', async () => {
    const { storage } = createStorage<{ locale: string }>(null)
    const store = await createPersistentStore({ storage, key: 'prefs', defaults: { locale: 'en' } })
    const listener = vi.fn()
    store.subscribe(listener)

    store.set({ locale: 'zh' })
    await store.flush()

    expect(listener).toHaveBeenCalledWith({ locale: 'zh' }, { locale: 'en' })
  })
})
