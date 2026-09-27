import { describe, expect, it, vi } from 'vitest'
import { createTrayController } from 'crinoid/tray'

type Listener = (...args: unknown[]) => void

function createTray() {
  const listeners = new Map<string, Listener>()
  return {
    listeners,
    setToolTip: vi.fn(),
    setContextMenu: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn((event: string, listener: Listener) => {
      listeners.set(event, listener)
    })
  }
}

function createWindow() {
  const listeners = new Map<string, Listener>()
  const window = {
    listeners,
    shown: 0,
    focused: 0,
    hide: vi.fn(),
    show: vi.fn(() => {
      window.shown += 1
    }),
    focus: vi.fn(() => {
      window.focused += 1
    }),
    restore: vi.fn(),
    close: vi.fn(),
    isDestroyed: () => false,
    once: vi.fn(),
    on: vi.fn((event: string, listener: Listener) => {
      listeners.set(event, listener)
    })
  }
  return window
}

const labels = { show: 'Show', quit: 'Quit' }

function createMenu() {
  return { buildFromTemplate: vi.fn(() => ({ id: 'menu' })) }
}

describe('tray controller', () => {
  it('configures the tray and shows the window on click', () => {
    const tray = createTray()
    const window = createWindow()
    const controller = createTrayController({ tray, window, menu: createMenu(), labels, tooltip: 'App', onQuit: () => {} })

    expect(tray.setToolTip).toHaveBeenCalledWith('App')
    expect(tray.setContextMenu).toHaveBeenCalled()

    tray.listeners.get('click')?.()

    expect(window.show).toHaveBeenCalled()
    expect(window.focus).toHaveBeenCalled()

    controller.dispose()
    expect(tray.destroy).toHaveBeenCalled()
  })

  it('hides the window on minimize when minimizeToTray is enabled', () => {
    const window = createWindow()
    createTrayController({
      tray: createTray(),
      window,
      menu: createMenu(),
      labels,
      tooltip: 'App',
      onQuit: () => {},
      minimizeToTray: true
    })

    const event = { preventDefault: vi.fn() }
    window.listeners.get('minimize')?.(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(window.hide).toHaveBeenCalled()
  })

  it('keeps the window alive on close until the app quits', () => {
    const window = createWindow()
    let quitting = false
    createTrayController({
      tray: createTray(),
      window,
      menu: createMenu(),
      labels,
      tooltip: 'App',
      onQuit: () => {},
      closeToTray: true,
      shouldQuit: () => quitting
    })

    const first = { preventDefault: vi.fn() }
    window.listeners.get('close')?.(first)
    expect(first.preventDefault).toHaveBeenCalled()
    expect(window.hide).toHaveBeenCalled()

    quitting = true
    const second = { preventDefault: vi.fn() }
    window.listeners.get('close')?.(second)
    expect(second.preventDefault).not.toHaveBeenCalled()
  })
})
