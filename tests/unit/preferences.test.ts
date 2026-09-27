import { describe, expect, it, vi } from 'vitest'
import { createPreferences } from 'crinoid/preferences'
import type { Storage } from 'crinoid/storage'

interface Prefs {
  theme: 'light' | 'dark'
  locale: string
  sidebarWidth: number
}

const DEFAULTS: Prefs = { theme: 'light', locale: 'en', sidebarWidth: 240 }

function createStorage() {
  const values = new Map<string, unknown>()
  return {
    get: async (key: string) => (values.get(key) as Prefs | undefined) ?? null,
    set: async (key: string, value: Prefs) => {
      values.set(key, value)
    },
    remove: async (key: string) => {
      values.delete(key)
    }
  } as Storage<Prefs>
}

describe('preferences', () => {
  it('returns defined values with defaults for missing keys', async () => {
    const preferences = await createPreferences({ storage: createStorage(), defaults: DEFAULTS })

    expect(preferences.get('theme')).toBe('light')
    expect(preferences.get('locale')).toBe('en')
  })

  it('updates a single key and persists it', async () => {
    const preferences = await createPreferences({ storage: createStorage(), defaults: DEFAULTS })
    const listener = vi.fn()
    preferences.subscribe(listener)

    preferences.set('theme', 'dark')
    await preferences.flush()

    expect(preferences.get('theme')).toBe('dark')
    expect(listener).toHaveBeenCalledWith('theme', 'dark')
  })

  it('resets to defaults', async () => {
    const preferences = await createPreferences({ storage: createStorage(), defaults: DEFAULTS })
    preferences.set('locale', 'zh')

    await preferences.reset()

    expect(preferences.get('locale')).toBe('en')
  })

  it('reads persisted preferences on startup', async () => {
    const storage = createStorage()
    await storage.set('preferences', { ...DEFAULTS, theme: 'dark' })

    const preferences = await createPreferences({ storage, defaults: DEFAULTS })
    expect(preferences.get('theme')).toBe('dark')
  })
})
