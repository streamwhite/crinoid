import { createStore, type ReadableStore, type Store } from './reactive.js'
import type { Storage } from './storage.js'

export interface PersistentStoreOptions<T> {
  readonly storage: Storage<T>
  readonly key: string
  readonly defaults: T
}

export interface PersistentStore<T> extends ReadableStore<T> {
  set(value: T): void
  update(updater: (value: T) => T): void
  flush(): Promise<void>
}

export async function createPersistentStore<T>(options: PersistentStoreOptions<T>): Promise<PersistentStore<T>> {
  const persisted = await options.storage.get(options.key)
  const initial = persisted === null ? options.defaults : { ...options.defaults, ...persisted }
  const store: Store<T> = createStore(initial)
  let queue: Promise<void> = Promise.resolve()

  const persist = (): void => {
    queue = queue.then(() => options.storage.set(options.key, store.get())).catch(() => {})
  }

  store.subscribe(() => persist())

  return {
    get: store.get,
    subscribe: store.subscribe,
    select: store.select,
    set: store.set,
    update: store.update,
    flush: () => queue
  }
}
