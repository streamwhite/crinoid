import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../../src/main/storage/memory'

describe('memory storage', () => {
  it('stores and removes JSON-safe values', async () => {
    const storage = createMemoryStorage<{ theme: string }>()
    await storage.set('preferences', { theme: 'dark' })
    expect(await storage.get('preferences')).toEqual({ theme: 'dark' })
    await storage.remove('preferences')
    expect(await storage.get('preferences')).toBeNull()
  })
})
