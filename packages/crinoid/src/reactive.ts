export type Listener<T> = (value: T, previous: T) => void

export interface ReadableStore<T> {
  get(): T
  subscribe(listener: Listener<T>): () => void
  select<R>(selector: (value: T) => R): ReadableStore<R>
}

export interface Store<T> extends ReadableStore<T> {
  set(value: T): void
  update(updater: (value: T) => T): void
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial
  const listeners = new Set<Listener<T>>()

  const notify = (previous: T): void => {
    for (const listener of [...listeners]) listener(value, previous)
  }

  const set = (next: T): void => {
    const previous = value
    value = next
    notify(previous)
  }

  return {
    get: () => value,
    set,
    update: (updater) => set(updater(value)),
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    select: <R>(selector: (current: T) => R) => createSelector(() => value, selector, listeners)
  }
}

function createSelector<T, R>(read: () => T, selector: (value: T) => R, source: Set<Listener<T>>): ReadableStore<R> {
  let selected = selector(read())
  const listeners = new Set<Listener<R>>()

  source.add(() => {
    const next = selector(read())
    if (Object.is(next, selected)) return
    const previous = selected
    selected = next
    for (const listener of [...listeners]) listener(next, previous)
  })

  return {
    get: () => selected,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    select: <S>(nextSelector: (value: R) => S) => createNestedSelector(() => selected, nextSelector, listeners)
  }
}

function createNestedSelector<T, R>(read: () => T, selector: (value: T) => R, source: Set<Listener<T>>): ReadableStore<R> {
  let selected = selector(read())
  const listeners = new Set<Listener<R>>()

  source.add((value) => {
    const next = selector(value)
    if (Object.is(next, selected)) return
    const previous = selected
    selected = next
    for (const listener of [...listeners]) listener(next, previous)
  })

  return {
    get: () => selected,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    select: <S>(nextSelector: (value: R) => S) => createNestedSelector(() => selected, nextSelector, listeners)
  }
}
