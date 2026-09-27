import { describe, expect, it, vi } from 'vitest'
import { createPowerMonitor, readBatteryStatus } from 'crinoid/power'

function createSource() {
  const listeners = new Map<string, Set<() => void>>()
  return {
    on: vi.fn((event: string, listener: () => void) => {
      const set = listeners.get(event) ?? new Set()
      set.add(listener)
      listeners.set(event, set)
    }),
    off: vi.fn((event: string, listener: () => void) => listeners.get(event)?.delete(listener)),
    emit: (event: string) => {
      for (const listener of listeners.get(event) ?? []) listener()
    }
  }
}

describe('battery status', () => {
  it('reports charging state and level', async () => {
    const status = await readBatteryStatus({
      getPowerSaveBlockerState: async () => 'charging',
      getBatteryLevel: async () => 0.8
    })

    expect(status).toEqual({ charging: true, level: 0.8 })
  })

  it('reports not-charging and unknown level', async () => {
    const status = await readBatteryStatus({
      getPowerSaveBlockerState: async () => 'unknown',
      getBatteryLevel: async () => 0
    })

    expect(status.charging).toBe(false)
    expect(status.level).toBe(0)
  })
})

describe('power monitor', () => {
  it('forwards suspend, resume, lock, and unlock events', () => {
    const source = createSource()
    const handlers = { onSuspend: vi.fn(), onResume: vi.fn(), onLock: vi.fn(), onUnlock: vi.fn() }
    createPowerMonitor(source, handlers)

    source.emit('suspend')
    source.emit('resume')
    source.emit('lock-screen')
    source.emit('unlock-screen')

    expect(handlers.onSuspend).toHaveBeenCalled()
    expect(handlers.onResume).toHaveBeenCalled()
    expect(handlers.onLock).toHaveBeenCalled()
    expect(handlers.onUnlock).toHaveBeenCalled()
  })

  it('stops forwarding after dispose', () => {
    const source = createSource()
    const onSuspend = vi.fn()
    const monitor = createPowerMonitor(source, { onSuspend })

    monitor.dispose()
    source.emit('suspend')

    expect(onSuspend).not.toHaveBeenCalled()
  })
})
