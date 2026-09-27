import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'crinoid/reactive'

describe('reactive store', () => {
  it('returns the current state and updates it', () => {
    const store = createStore({ count: 0 })

    expect(store.get()).toEqual({ count: 0 })
    store.set({ count: 1 })
    expect(store.get().count).toBe(1)
  })

  it('notifies subscribers on every set', () => {
    const store = createStore({ count: 0 })
    const listener = vi.fn()
    store.subscribe(listener)

    store.set({ count: 0 })
    store.set({ count: 2 })

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith({ count: 2 }, { count: 0 })
  })

  it('stops notifying after unsubscribe', () => {
    const store = createStore(0)
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    unsubscribe()
    store.set(1)

    expect(listener).not.toHaveBeenCalled()
  })

  it('derives values and emits through selectors', () => {
    const store = createStore({ items: [1, 2] })
    const total = store.select((state) => state.items.length)
    const listener = vi.fn()
    total.subscribe(listener)

    store.set({ items: [1, 2, 3] })

    expect(total.get()).toBe(3)
    expect(listener).toHaveBeenCalledWith(3, 2)
  })
})
