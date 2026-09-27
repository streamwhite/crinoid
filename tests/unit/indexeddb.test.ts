import { describe, expect, it } from 'vitest'
import { createIndexedDbStore, type IdbFactoryLike } from 'crinoid/indexeddb'

function createFakeIdb() {
  const records = new Map<string, Map<string, unknown>>()
  const factory: IdbFactoryLike = {
    open: () => {
      const request: {
        result: unknown
        onsuccess?: () => void
        onerror?: () => void
        onupgradeneeded?: () => void
      } = { result: {} }
      queueMicrotask(() => {
        const db = {
          objectStoreNames: { contains: (name: string) => records.has(name) },
          createObjectStore: (name: string) => {
            records.set(name, new Map())
          },
          transaction: (name: string) => {
            records.set(name, records.get(name) ?? new Map())
            const store = records.get(name)!
            return {
              objectStore: () => ({
                get: (key: string) => {
                  const getRequest: { result?: unknown; onsuccess?: () => void } = {}
                  queueMicrotask(() => {
                    getRequest.result = store.get(key)
                    getRequest.onsuccess?.()
                  })
                  return getRequest
                },
                put: (value: unknown, key: string) => {
                  store.set(key, value)
                },
                delete: (key: string) => {
                  store.delete(key)
                },
                getAllKeys: () => {
                  const getRequest: { result?: unknown; onsuccess?: () => void } = {}
                  queueMicrotask(() => {
                    getRequest.result = [...store.keys()]
                    getRequest.onsuccess?.()
                  })
                  return getRequest
                }
              })
            }
          }
        }
        request.result = db
        request.onsuccess?.()
      })
      return request as never
    }
  }
  return { factory, records }
}

describe('indexeddb store', () => {
  it('opens a database and performs get/set/delete', async () => {
    const { factory } = createFakeIdb()
    const store = await createIndexedDbStore<{ id: string; body: string }>({
      factory,
      databaseName: 'app',
      storeName: 'notes'
    })

    await store.set('n1', { id: 'n1', body: 'hello' })
    expect(await store.get('n1')).toEqual({ id: 'n1', body: 'hello' })

    await store.delete('n1')
    expect(await store.get('n1')).toBeUndefined()
  })

  it('lists keys in the store', async () => {
    const { factory } = createFakeIdb()
    const store = await createIndexedDbStore<number>({ factory, databaseName: 'app', storeName: 'counts' })

    await store.set('a', 1)
    await store.set('b', 2)

    expect((await store.keys()).sort()).toEqual(['a', 'b'])
  })
})
