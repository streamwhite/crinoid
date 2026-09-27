import { describe, expect, it, vi } from 'vitest'
import { createPlatformIntegration } from 'crinoid/integration'

function createTaskbar() {
  return { setProgressBar: vi.fn(), flashFrame: vi.fn() }
}

function createDock() {
  return { setBadge: vi.fn(), bounce: vi.fn(() => 7), cancelBounce: vi.fn() }
}

describe('platform integration', () => {
  it('sets the badge count through the app when supported', () => {
    const setBadgeCount = vi.fn()

    createPlatformIntegration({ app: { setBadgeCount }, taskbar: createTaskbar() }).setBadge(3)

    expect(setBadgeCount).toHaveBeenCalledWith(3)
  })

  it('falls back to the macOS dock badge', () => {
    const dock = createDock()

    createPlatformIntegration({ app: { dock }, taskbar: createTaskbar(), isMacOS: true }).setBadge(2)

    expect(dock.setBadge).toHaveBeenCalledWith('2')
  })

  it('bounces the macOS dock for attention', () => {
    const dock = createDock()

    createPlatformIntegration({ app: { dock }, taskbar: createTaskbar(), isMacOS: true }).requestAttention(true)

    expect(dock.bounce).toHaveBeenCalledWith('critical')
  })

  it('flashes the taskbar outside macOS', () => {
    const taskbar = createTaskbar()

    createPlatformIntegration({ app: {}, taskbar, isMacOS: false }).requestAttention()

    expect(taskbar.flashFrame).toHaveBeenCalledWith(true)
  })

  it('reports progress and flash state', () => {
    const taskbar = createTaskbar()
    const integration = createPlatformIntegration({ app: {}, taskbar })

    integration.setProgress(0.5)
    integration.flash(false)

    expect(taskbar.setProgressBar).toHaveBeenCalledWith(0.5)
    expect(taskbar.flashFrame).toHaveBeenCalledWith(false)
  })
})
