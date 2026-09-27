import { describe, expect, it, vi } from 'vitest'
import { createAppLifecycle } from 'crinoid/lifecycle'

type Listener = (...args: unknown[]) => void

function createFakeApp() {
  const listeners = new Map<string, Listener[]>()
  return {
    listeners,
    quit: vi.fn(),
    on(event: string, listener: Listener) {
      listeners.set(event, [...(listeners.get(event) ?? []), listener])
      return this
    },
    off(event: string, listener: Listener) {
      listeners.set(event, (listeners.get(event) ?? []).filter((item) => item !== listener))
      return this
    },
    emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) listener(...args)
    }
  }
}

describe('application lifecycle', () => {
  it('invokes readiness when the application is ready', () => {
    const app = createFakeApp()
    const onReady = vi.fn()

    createAppLifecycle({ app, onReady })
    app.emit('ready')

    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it('runs shutdown tasks before quitting', async () => {
    const app = createFakeApp()
    const task = vi.fn()
    const lifecycle = createAppLifecycle({ app, onReady: () => {} })
    lifecycle.shutdown.register({ name: 'task', run: task })

    const event = { preventDefault: vi.fn() }
    app.emit('before-quit', event)

    await vi.waitFor(() => expect(app.quit).toHaveBeenCalledTimes(1))
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('quits when the last window closes outside macOS', () => {
    const app = createFakeApp()
    createAppLifecycle({ app, onReady: () => {}, isMacOS: false })

    app.emit('window-all-closed')

    expect(app.quit).toHaveBeenCalledTimes(1)
  })

  it('stays alive when the last window closes on macOS', () => {
    const app = createFakeApp()
    createAppLifecycle({ app, onReady: () => {}, isMacOS: true })

    app.emit('window-all-closed')

    expect(app.quit).not.toHaveBeenCalled()
  })

  it('invokes the activation handler', () => {
    const app = createFakeApp()
    const onActivate = vi.fn()

    createAppLifecycle({ app, onReady: () => {}, onActivate })
    app.emit('activate')

    expect(onActivate).toHaveBeenCalledTimes(1)
  })
})
