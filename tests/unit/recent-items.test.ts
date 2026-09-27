import { describe, expect, it } from 'vitest'
import { createRecentItems } from 'crinoid/recent-items'

describe('recent items', () => {
  it('adds items to the front and lists them newest first', () => {
    const recent = createRecentItems()

    recent.add('/a')
    recent.add('/b')

    expect(recent.list()).toEqual(['/b', '/a'])
  })

  it('moves an existing item to the front instead of duplicating', () => {
    const recent = createRecentItems()
    recent.add('/a')
    recent.add('/b')

    recent.add('/a')

    expect(recent.list()).toEqual(['/a', '/b'])
  })

  it('caps the list at the configured limit', () => {
    const recent = createRecentItems({ limit: 2 })

    recent.add('/a')
    recent.add('/b')
    recent.add('/c')

    expect(recent.list()).toEqual(['/c', '/b'])
  })

  it('removes and clears items', () => {
    const recent = createRecentItems()
    recent.add('/a')
    recent.add('/b')

    recent.remove('/a')
    expect(recent.list()).toEqual(['/b'])

    recent.clear()
    expect(recent.list()).toEqual([])
  })

  it('notifies subscribers on changes', () => {
    const recent = createRecentItems()
    const seen: number[] = []
    recent.subscribe((items) => seen.push(items.length))

    recent.add('/a')

    expect(seen).toEqual([1])
    expect(recent.entries()[0]?.path).toBe('/a')
  })
})
