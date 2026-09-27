import { describe, expect, it } from 'vitest'
import { createDesktopConfig, DEFAULT_FEATURES } from 'crinoid/config'
import { createApiClient, createApiError, getErrorMessage } from 'crinoid/api'
import { createMemoryStorage } from 'crinoid/storage'
import { IPC_CHANNELS, createChannel } from 'crinoid/ipc'
import { createModuleRuntime, createWindowRegistry, isAllowedExternalUrl, resolveEnvironment } from 'crinoid'

describe('desktop config', () => {
  it('applies defaults and validates HTTPS', () => {
    expect(createDesktopConfig({ appName: 'App' }).features).toEqual(DEFAULT_FEATURES)
    expect(() => createDesktopConfig({ appName: 'App', apiBaseUrl: 'http://insecure.example' })).toThrow('HTTPS')
  })
})

describe('api client', () => {
  it('normalizes HTTP errors without leaking bodies', () => {
    const error = createApiError(401, 'Unauthorized')
    expect(getErrorMessage(error)).toBe('Request was not authorized')
    expect(createApiClient('https://api.example').request).toBeTypeOf('function')
  })
})

describe('storage', () => {
  it('stores and removes values', async () => {
    const storage = createMemoryStorage<{ theme: string }>()
    await storage.set('preferences', { theme: 'dark' })
    expect(await storage.get('preferences')).toEqual({ theme: 'dark' })
    await storage.remove('preferences')
    expect(await storage.get('preferences')).toBeNull()
  })
})

describe('ipc contract', () => {
  it('exposes explicit capability channels only', () => {
    expect(Object.values(IPC_CHANNELS)).not.toContain('execute')
    expect(IPC_CHANNELS.getVersion).toBe('app.get-version')
  })
})

describe('security', () => {
  it('allows only approved external protocols', () => {
    expect(isAllowedExternalUrl('https://example.com')).toBe(true)
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('typed ipc channels', () => {
  it('carries the channel name and validates payloads', () => {
    const channel = createChannel<{ id: string }, { id: string }>(
      'feature.do-work',
      (value): value is { id: string } => typeof (value as { id?: unknown })?.id === 'string'
    )
    expect(channel.name).toBe('feature.do-work')
    expect(channel.validate({ id: '1' })).toBe(true)
    expect(channel.validate({})).toBe(false)
  })
})

describe('module runtime', () => {
  it('initializes modules with capabilities and disposes them in order', async () => {
    const calls: string[] = []
    const firstCapabilities = { seen: false }
    const runtime = createModuleRuntime([
      {
        id: 'alpha',
        initialize: ({ capabilities }) => {
          firstCapabilities.seen = capabilities.has('alpha')
          calls.push('alpha:init')
        },
        dispose: () => {
          calls.push('alpha:dispose')
        }
      },
      { id: 'beta', initialize: () => void calls.push('beta:init') }
    ])

    await runtime.initialize(new Set(['alpha']))
    await runtime.dispose()

    expect(firstCapabilities.seen).toBe(true)
    expect(calls).toEqual(['alpha:init', 'beta:init', 'alpha:dispose'])
  })
})

describe('window registry', () => {
  it('reuses a live window and creates a new one after it is destroyed', () => {
    const registry = createWindowRegistry<{
      id: number
      shown: number
      focused: number
      destroyed: boolean
      close(): void
      listeners: (() => void)[]
      show(): void
      focus(): void
      isDestroyed(): boolean
      once(_event: string, listener: () => void): void
    }>()

    let created = 0
    const makeWindow = () => {
      created += 1
      const window = {
        id: created,
        shown: 0,
        focused: 0,
        destroyed: false,
        show: () => void (window.shown += 1),
        focus: () => void (window.focused += 1),
        close: () => {},
        isDestroyed: () => window.destroyed,
        once: (_event: string, listener: () => void) => void window.listeners.push(listener),
        listeners: [] as (() => void)[]
      }
      return window
    }

    const reused = registry.open('main', makeWindow)
    expect(registry.open('main', makeWindow)).toBe(reused)
    expect(created).toBe(1)

    reused.destroyed = true
    expect(registry.open('main', makeWindow)).not.toBe(reused)
    expect(created).toBe(2)
  })

  it('broadcasts to every live window and tracks the open set', () => {
    type Sent = { channel: string; payload: unknown }
    const sent: Sent[] = []
    const registry = createWindowRegistry<{
      name: string
      destroyed: boolean
      messages: Sent[]
      webContents: { send(channel: string, ...args: unknown[]): void }
      close(): void
      show(): void
      focus(): void
      isDestroyed(): boolean
      once(_event: string, listener: () => void): void
    }>()

    const makeWindow = (name: string) => ({
      name,
      destroyed: false,
      messages: sent,
      webContents: {
        send: (channel: string, ...args: unknown[]) => {
          sent.push({ channel, payload: args[0] })
        }
      },
      close: () => {},
      show: () => {},
      focus: () => {},
      isDestroyed: () => false,
      once: (_event: string, _listener: () => void) => {}
    })

    registry.open('main', () => makeWindow('main'))
    registry.open('settings', () => makeWindow('settings'))

    expect(registry.size()).toBe(2)
    expect([...registry.ids()].sort()).toEqual(['main', 'settings'])
    expect(registry.broadcast('theme.changed', 'dark')).toBe(2)
    expect(sent).toEqual([
      { channel: 'theme.changed', payload: 'dark' },
      { channel: 'theme.changed', payload: 'dark' }
    ])
    expect(registry.get('main')?.name).toBe('main')
  })
})

describe('environment', () => {
  it('is exposed from the package root', () => {
    expect(resolveEnvironment({ isPackaged: true }).isProduction).toBe(true)
  })
})
