import { describe, expect, it } from 'vitest'
import { createFavorites } from 'crinoid/favorites'
import { createHistory } from 'crinoid/history'

describe('favorites', () => {
  it('adds, toggles, and lists favorites without duplicates', () => {
    const favorites = createFavorites()

    favorites.add({ id: 'a', title: 'Alpha' })
    favorites.add('a')
    favorites.add('b')

    expect(favorites.ids()).toEqual(['a', 'b'])
    expect(favorites.has('a')).toBe(true)
    expect(favorites.toggle('a')).toBe(false)
    expect(favorites.ids()).toEqual(['b'])
    expect(favorites.toggle({ id: 'a', title: 'Alpha' })).toBe(true)
    expect(favorites.list()[1]?.title).toBe('Alpha')
  })

  it('notifies subscribers and clears', () => {
    const favorites = createFavorites()
    const sizes: number[] = []
    favorites.subscribe((items) => sizes.push(items.length))

    favorites.add('a')
    favorites.clear()

    expect(sizes).toEqual([1, 0])
  })
})

describe('undo/redo history', () => {
  it('tracks past, present, and future', () => {
    const history = createHistory('a')
    history.push('b')
    history.push('c')

    expect(history.current()).toBe('c')
    expect(history.canUndo()).toBe(true)
    expect(history.undo()).toBe('b')
    expect(history.undo()).toBe('a')
    expect(history.undo()).toBeUndefined()
    expect(history.redo()).toBe('b')
    expect(history.current()).toBe('b')
  })

  it('drops the redo stack after a new push and caps the limit', () => {
    const history = createHistory(0, { limit: 2 })
    history.push(1)
    history.push(2)
    history.undo()
    expect(history.canRedo()).toBe(true)

    history.push(3)
    expect(history.canRedo()).toBe(false)
    expect(history.state().past).toEqual([0, 1])

    history.push(4)
    expect(history.state().past).toEqual([1, 3])
  })

  it('resets to a value', () => {
    const history = createHistory('a')
    history.push('b')
    history.clear('z')

    expect(history.current()).toBe('z')
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })
})
