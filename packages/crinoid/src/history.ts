import { createStore, type ReadableStore } from './reactive.js'

export interface HistoryState<T> {
  readonly past: readonly T[]
  readonly present: T
  readonly future: readonly T[]
}

export interface HistoryOptions {
  readonly limit?: number
}

export interface History<T> {
  push(value: T): void
  undo(): T | undefined
  redo(): T | undefined
  current(): T
  canUndo(): boolean
  canRedo(): boolean
  clear(value?: T): void
  state(): HistoryState<T>
  subscribe(listener: (state: HistoryState<T>) => void): () => void
  store(): ReadableStore<HistoryState<T>>
}

const DEFAULT_LIMIT = 50

export function createHistory<T>(initial: T, options: HistoryOptions = {}): History<T> {
  const limit = Math.max(options.limit ?? DEFAULT_LIMIT, 1)
  const store = createStore<HistoryState<T>>({ past: [], present: initial, future: [] })

  return {
    push: (value) => {
      const state = store.get()
      store.set({ past: [...state.past, state.present].slice(-limit), present: value, future: [] })
    },
    undo: () => {
      const state = store.get()
      const previous = state.past[state.past.length - 1]
      if (previous === undefined) return undefined
      store.set({ past: state.past.slice(0, -1), present: previous, future: [state.present, ...state.future] })
      return previous
    },
    redo: () => {
      const state = store.get()
      const next = state.future[0]
      if (next === undefined) return undefined
      store.set({ past: [...state.past, state.present].slice(-limit), present: next, future: state.future.slice(1) })
      return next
    },
    current: () => store.get().present,
    canUndo: () => store.get().past.length > 0,
    canRedo: () => store.get().future.length > 0,
    clear: (value = initial) => store.set({ past: [], present: value, future: [] }),
    state: () => store.get(),
    subscribe: (listener) => store.subscribe((value) => listener(value)),
    store: () => store
  }
}
