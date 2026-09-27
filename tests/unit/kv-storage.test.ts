import { describe, expect, it } from 'vitest'
import { createKeyValueStorage } from 'crinoid/storage'
import { createMemoryStorage } from 'crinoid/storage'

describe('key-value storage facade', () => {
  it('namespaces keys so apps do not collide', async () => {
    const backing = createMemoryStorage<string>()
    const kv = createKeyValueStorage<string>(backing, 'app-a')

    await kv.set('theme', 'dark')
    await backing.set('theme', 'root')

    expect(await kv.get('theme')).toBe('dark')
    expect(await backing.get('app-a:theme')).toBe('dark')
    expect(await kv.keys()).toEqual(['theme'])
    expect(await backing.keys?.()).toEqual(expect.arrayContaining(['app-a:theme', 'theme']))
  })

  it('reads and writes plain values', async () => {
    const kv = createKeyValueStorage<number>(createMemoryStorage<number>(), 'ns')

    await kv.set('count', 3)
    expect(await kv.get('count')).toBe(3)

    await kv.remove('count')
    expect(await kv.get('count')).toBeNull()
  })
})
