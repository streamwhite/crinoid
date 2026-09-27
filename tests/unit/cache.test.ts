import { describe, expect, it, vi } from 'vitest'
import { createCache } from 'crinoid/cache'

describe('local cache', () => {
  it('stores and returns values until they expire', async () => {
    let now = 0
    const cache = createCache<string>({ ttlMs: 1_000, now: () => now })
    const loader = vi.fn(async () => 'value')

    await expect(cache.get('key', loader)).resolves.toBe('value')
    await expect(cache.get('key', loader)).resolves.toBe('value')

    expect(loader).toHaveBeenCalledTimes(1)

    now = 1_001
    await cache.get('key', loader)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('invalidates and clears entries', async () => {
    const cache = createCache<number>({ ttlMs: 1_000, now: () => 0 })
    await cache.set('a', 1)
    expect(await cache.peek('a')).toBe(1)

    cache.invalidate('a')
    expect(await cache.peek('a')).toBeNull()

    await cache.set('b', 2)
    cache.clear()
    expect(await cache.peek('b')).toBeNull()
  })

  it('deduplicates concurrent loads for the same key', async () => {
    const cache = createCache<string>({ ttlMs: 1_000, now: () => 0 })
    let resolve: ((value: string) => void) | undefined
    const loader = vi.fn(() => new Promise<string>((r) => {
      resolve = r
    }))

    const first = cache.get('key', loader)
    const second = cache.get('key', loader)
    resolve?.('shared')

    await expect(first).resolves.toBe('shared')
    await expect(second).resolves.toBe('shared')
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
