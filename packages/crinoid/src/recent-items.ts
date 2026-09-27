import { createStore, type ReadableStore } from './reactive.js'

export interface RecentItem {
  readonly path: string
  readonly title?: string | undefined
  readonly at: number
}

export interface RecentItemsOptions {
  readonly limit?: number
  readonly now?: () => number
}

export type RecentEntry = string | { path: string; title?: string }

export interface RecentItems {
  add(item: RecentEntry): void
  remove(path: string): void
  clear(): void
  list(): readonly string[]
  entries(): readonly RecentItem[]
  subscribe(listener: (items: readonly RecentItem[]) => void): () => void
  store(): ReadableStore<readonly RecentItem[]>
}

const DEFAULT_LIMIT = 10

export function createRecentItems(options: RecentItemsOptions = {}): RecentItems {
  const limit = options.limit ?? DEFAULT_LIMIT
  const now = options.now ?? (() => Date.now())
  const store = createStore<readonly RecentItem[]>([])

  const commit = (items: readonly RecentItem[]): void => {
    store.set(items.slice(0, limit))
  }

  return {
    add: (item) => {
      const path = typeof item === 'string' ? item : item.path
      const title = typeof item === 'string' ? undefined : item.title
      const entry: RecentItem = { path, ...(title === undefined ? {} : { title }), at: now() }
      commit([entry, ...store.get().filter((current) => current.path !== path)])
    },
    remove: (path) => commit(store.get().filter((current) => current.path !== path)),
    clear: () => commit([]),
    list: () => store.get().map((item) => item.path),
    entries: () => store.get(),
    subscribe: (listener) => store.subscribe((value) => listener(value)),
    store: () => store
  }
}

