import { createStore, type ReadableStore } from './reactive.js'

export interface FavoriteItem {
  readonly id: string
  readonly title?: string | undefined
  readonly at: number
}

export interface FavoritesOptions {
  readonly now?: () => number
}

export type FavoriteEntry = string | { id: string; title?: string }

export interface Favorites {
  add(entry: FavoriteEntry): void
  remove(id: string): void
  toggle(entry: FavoriteEntry): boolean
  has(id: string): boolean
  list(): readonly FavoriteItem[]
  ids(): readonly string[]
  clear(): void
  subscribe(listener: (items: readonly FavoriteItem[]) => void): () => void
  store(): ReadableStore<readonly FavoriteItem[]>
}

export function createFavorites(options: FavoritesOptions = {}): Favorites {
  const now = options.now ?? (() => Date.now())
  const store = createStore<readonly FavoriteItem[]>([])

  const add = (entry: FavoriteEntry): void => {
    const id = typeof entry === 'string' ? entry : entry.id
    const title = typeof entry === 'string' ? undefined : entry.title
    if (store.get().some((item) => item.id === id)) return
    store.set([...store.get(), { id, ...(title === undefined ? {} : { title }), at: now() }])
  }

  const remove = (id: string): void => {
    store.set(store.get().filter((item) => item.id !== id))
  }

  return {
    add,
    remove,
    toggle: (entry) => {
      const id = typeof entry === 'string' ? entry : entry.id
      const favorite = store.get().some((item) => item.id === id)
      if (favorite) remove(id)
      else add(entry)
      return !favorite
    },
    has: (id) => store.get().some((item) => item.id === id),
    list: () => store.get(),
    ids: () => store.get().map((item) => item.id),
    clear: () => store.set([]),
    subscribe: (listener) => store.subscribe((value) => listener(value)),
    store: () => store
  }
}
