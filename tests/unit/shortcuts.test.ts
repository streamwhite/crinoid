import { describe, expect, it, vi } from 'vitest'
import { createShortcutManager } from 'crinoid/shortcuts'

function createPort() {
  const registered = new Map<string, () => void>()
  return {
    registered,
    register: vi.fn((accelerator: string, callback: () => void) => {
      registered.set(accelerator, callback)
      return true
    }),
    unregister: vi.fn((accelerator: string) => {
      registered.delete(accelerator)
    }),
    unregisterAll: vi.fn(() => registered.clear()),
    isRegistered: vi.fn((accelerator: string) => registered.has(accelerator))
  }
}

describe('shortcut manager', () => {
  it('registers and fires an accelerator', () => {
    const port = createPort()
    const action = vi.fn()
    const manager = createShortcutManager(port)

    expect(manager.register('CommandOrControl+K', action)).toBe(true)
    port.registered.get('CommandOrControl+K')?.()

    expect(action).toHaveBeenCalledTimes(1)
  })

  it('registers a batch and reports registration state', () => {
    const port = createPort()
    const manager = createShortcutManager(port)

    manager.registerAll({ 'CmdOrCtrl+A': () => {}, 'CmdOrCtrl+B': () => {} })

    expect(manager.isRegistered('CmdOrCtrl+A')).toBe(true)
    expect(manager.isRegistered('CmdOrCtrl+C')).toBe(false)
  })

  it('unregisters individual shortcuts and all owned shortcuts on dispose', () => {
    const port = createPort()
    const manager = createShortcutManager(port)
    manager.register('CmdOrCtrl+A', () => {})
    manager.register('CmdOrCtrl+B', () => {})

    manager.unregister('CmdOrCtrl+A')
    manager.dispose()

    expect(port.unregister).toHaveBeenCalledWith('CmdOrCtrl+A')
    expect(port.unregister).toHaveBeenCalledWith('CmdOrCtrl+B')
    expect(manager.isRegistered('CmdOrCtrl+B')).toBe(false)
  })
})
