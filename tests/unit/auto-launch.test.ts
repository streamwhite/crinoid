import { describe, expect, it } from 'vitest'
import { createAutoLaunch, type LoginItemSettings } from 'crinoid/auto-launch'

interface Settings {
  openAtLogin: boolean
  openAsHidden?: boolean
  args?: string[]
}

function createPort(initial = false) {
  let openAtLogin = initial
  const calls: Settings[] = []
  return {
    calls,
    port: {
      getLoginItemSettings: (): LoginItemSettings => ({ openAtLogin }),
      setLoginItemSettings: (settings: Settings) => {
        calls.push(settings)
        openAtLogin = settings.openAtLogin
      }
    }
  }
}

describe('auto launch', () => {
  it('enables, disables, and toggles login at startup', () => {
    const { port, calls } = createPort()
    const autoLaunch = createAutoLaunch(port, { openAsHidden: true, args: ['--hidden'] })

    expect(autoLaunch.isEnabled()).toBe(false)
    autoLaunch.enable()
    expect(autoLaunch.isEnabled()).toBe(true)
    expect(calls[0]).toEqual({ openAtLogin: true, openAsHidden: true, args: ['--hidden'] })

    expect(autoLaunch.toggle()).toBe(false)
    expect(autoLaunch.isEnabled()).toBe(false)

    expect(autoLaunch.toggle()).toBe(true)
    expect(autoLaunch.isEnabled()).toBe(true)
  })

  it('sets an explicit enabled state', () => {
    const { port, calls } = createPort(true)
    const autoLaunch = createAutoLaunch(port)

    autoLaunch.setEnabled(false)

    expect(calls).toEqual([{ openAtLogin: false }])
  })
})
