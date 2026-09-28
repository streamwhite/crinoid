import { describe, expect, it, vi } from 'vitest'
import { createBrowserNetworkMonitor, createNetworkMonitor, isBrowserOnline, readNetworkStatus } from 'crinoid/network'

describe('network status', () => {
  it('reports online when connected', async () => {
    await expect(readNetworkStatus({ isOnline: () => true })).resolves.toEqual({ online: true, type: 'unknown' })
  })

  it('reports offline when disconnected', async () => {
    await expect(readNetworkStatus({ isOnline: () => false })).resolves.toEqual({ online: false, type: 'unknown' })
  })
})

describe('network monitor', () => {
  it('emits online and offline transitions', () => {
    const handlers = new Set<(online: boolean) => void>()
    const subscription = {
      addEventListener: vi.fn((_event: string, listener: (online: boolean) => void) => handlers.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: (online: boolean) => void) => handlers.delete(listener))
    }
    const onChange = vi.fn()
    const monitor = createNetworkMonitor(subscription, { onChange, isOnline: () => true })

    for (const handler of handlers) handler(false)

    expect(onChange).toHaveBeenCalledWith(false)
    monitor.dispose()
    expect(subscription.removeEventListener).toHaveBeenCalled()
  })

  it('ignores notifications that match the current connection state', () => {
    const handlers = new Set<(online: boolean) => void>()
    const subscription = {
      addEventListener: (_event: string, listener: (online: boolean) => void) => handlers.add(listener),
      removeEventListener: () => {}
    }
    const onChange = vi.fn()
    createNetworkMonitor(subscription, { onChange, isOnline: () => true })

    for (const handler of handlers) handler(true)

    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('browser network monitor', () => {
  it('reads the browser online flag', () => {
    const global = { online: true, addEventListener: () => {}, removeEventListener: () => {} }

    expect(isBrowserOnline(global)).toBe(true)
    expect(isBrowserOnline({ ...global, online: false })).toBe(false)
  })
  it('maps online/offline events and disposes', () => {
    const listeners = new Map<string, () => void>()
    const global = {
      online: true,
      addEventListener: vi.fn((event: string, listener: () => void) => listeners.set(event, listener)),
      removeEventListener: vi.fn((event: string) => listeners.delete(event))
    }
    const onChange = vi.fn()

    const monitor = createBrowserNetworkMonitor(global, onChange)
    listeners.get('offline')?.()
    listeners.get('online')?.()

    expect(onChange).toHaveBeenNthCalledWith(1, false)
    expect(onChange).toHaveBeenNthCalledWith(2, true)
    monitor.dispose()
    expect(global.removeEventListener).toHaveBeenCalledTimes(2)
  })
})
