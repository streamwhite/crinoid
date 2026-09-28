import { describe, expect, it, vi } from 'vitest'
import type { DesktopAPI } from 'crinoid/ipc'

const bridge = vi.hoisted(() => ({
  exposed: undefined as { key: string; value: unknown } | undefined,
  rendererListeners: new Map<string, Set<(...args: unknown[]) => void>>(),
  invoked: [] as Array<{ channel: string; args: unknown[] }>,
  sent: [] as Array<{ channel: string; args: unknown[] }>,
  pathForFile: vi.fn((file: unknown) => `/resolved/${String((file as { name?: string }).name ?? file)}`)
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key: string, value: unknown) => {
      bridge.exposed = { key, value }
    }
  },
  ipcRenderer: {
    invoke: async (channel: string, ...args: unknown[]) => {
      bridge.invoked.push({ channel, args })
      return `invoked:${channel}`
    },
    send: (channel: string, ...args: unknown[]) => {
      bridge.sent.push({ channel, args })
    },
    on: (channel: string, listener: (...args: unknown[]) => void) => {
      const set = bridge.rendererListeners.get(channel) ?? new Set<(...args: unknown[]) => void>()
      set.add(listener)
      bridge.rendererListeners.set(channel, set)
    },
    removeListener: (channel: string, listener: (...args: unknown[]) => void) => {
      bridge.rendererListeners.get(channel)?.delete(listener)
    }
  },
  webUtils: { getPathForFile: bridge.pathForFile }
}))

import { exposeDesktopApi } from 'crinoid/preload'

function desktop(): DesktopAPI {
  exposeDesktopApi()
  if (!bridge.exposed) throw new Error('desktop bridge was not exposed')
  expect(bridge.exposed.key).toBe('desktop')
  return bridge.exposed.value as DesktopAPI
}

describe('exposeDesktopApi', () => {
  it('exposes the fixed capability surface under window.desktop', () => {
    const api = desktop()

    expect(Object.keys(api).sort()).toEqual([
      'app',
      'auth',
      'clipboard',
      'contextMenu',
      'crash',
      'dialog',
      'feedback',
      'fs',
      'network',
      'notifications',
      'power',
      'preferences',
      'recentFiles',
      'secrets',
      'shell',
      'store',
      'system',
      'transfers',
      'updates',
      'window'
    ])
    expect((api as unknown as Record<string, unknown>).invoke).toBeUndefined()
    expect((api as unknown as Record<string, unknown>).send).toBeUndefined()
  })

  it('routes request/response calls to their typed channels', async () => {
    const api = desktop()

    await api.app.getVersion()
    await api.dialog.confirm({ message: 'Delete?', confirmLabel: 'Delete', cancelLabel: 'Keep' })
    await api.secrets.set('token', 'value')

    expect(bridge.invoked.map((call) => call.channel)).toEqual(['app.get-version', 'dialog.confirm', 'secrets.set'])
    expect(bridge.invoked[1]?.args[0]).toMatchObject({ message: 'Delete?' })
    expect(bridge.invoked[2]?.args[0]).toEqual({ key: 'token', value: 'value' })
  })

  it('routes fire-and-forget window controls over send', () => {
    const api = desktop()

    api.window.minimize()
    api.window.setAlwaysOnTop(true)
    api.app.setBadge(4)

    expect(bridge.sent).toEqual([
      { channel: 'window.minimize', args: [] },
      { channel: 'window.set-always-on-top', args: [true] },
      { channel: 'app.set-badge', args: [4] }
    ])
  })

  it('subscribes and unsubscribes renderer event listeners', () => {
    const api = desktop()
    const received: unknown[] = []

    const unsubscribe = api.store.onChange((value) => received.push(value))
    const handlers = bridge.rendererListeners.get('store.changed')
    expect(handlers?.size).toBe(1)

    for (const handler of handlers ?? []) handler({}, 'next-theme')
    expect(received).toEqual(['next-theme'])

    unsubscribe()
    expect(handlers?.size).toBe(0)
  })

  it('resolves dropped file paths through webUtils', () => {
    const api = desktop()
    const file = { name: 'report.pdf' } as unknown as File

    expect(api.fs.pathForFile(file)).toBe('/resolved/report.pdf')
    expect(bridge.pathForFile).toHaveBeenCalledWith(file)
  })
})
