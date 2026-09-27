import { describe, expect, it } from 'vitest'
import { createAboutInfo, formatAboutText } from 'crinoid/about'
import { createHelpService } from 'crinoid/help'
import { createSettings } from 'crinoid/settings'
import { createMemoryStorage } from 'crinoid/storage'

describe('settings', () => {
  it('loads defaults, persists changes, and resets', async () => {
    const storage = createMemoryStorage<unknown>()
    const settings = await createSettings({ storage, defaults: { theme: 'light', locale: 'en' } })

    expect(settings.all()).toEqual({ theme: 'light', locale: 'en' })
    settings.set('theme', 'dark')
    await settings.flush()

    const reloaded = await createSettings({ storage, defaults: { theme: 'light', locale: 'en' } })
    expect(reloaded.get('theme')).toBe('dark')

    await settings.reset()
    expect(settings.get('theme')).toBe('light')
  })

  it('migrates persisted values from older versions', async () => {
    const storage = createMemoryStorage<unknown>()
    await storage.set('settings', { version: 1, data: { theme: 'dark' } })

    const settings = await createSettings({
      storage,
      defaults: { theme: 'light', locale: 'en' },
      version: 2,
      migrate: (raw) => ({ ...(raw as object), locale: 'fr' }) as { theme: string; locale: string }
    })

    expect(settings.get('theme')).toBe('dark')
    expect(settings.get('locale')).toBe('fr')
    expect(settings.version()).toBe(2)
  })
})

describe('about', () => {
  it('drops undefined versions and formats text', () => {
    const info = createAboutInfo({
      name: 'App',
      version: '1.0.0',
      platform: 'linux',
      arch: 'x64',
      versions: { electron: '44.0.0', node: undefined, chrome: '130.0.0' },
      license: 'MIT'
    })

    expect(info.versions).toEqual({ electron: '44.0.0', chrome: '130.0.0' })
    expect(formatAboutText(info)).toContain('App 1.0.0')
    expect(formatAboutText(info)).toContain('MIT')
  })
})

describe('help', () => {
  it('opens allowlisted links and rejects others', async () => {
    const opened: string[] = []
    const help = createHelpService({
      openExternal: async (url) => {
        opened.push(url)
      },
      links: { docs: 'https://docs.example.com', unsafe: 'javascript:alert(1)' }
    })

    expect(help.has('docs')).toBe(true)
    await expect(help.open('docs')).resolves.toBe(true)
    await expect(help.open('unsafe')).resolves.toBe(false)
    await expect(help.open('missing')).resolves.toBe(false)
    expect(opened).toEqual(['https://docs.example.com'])
  })
})
