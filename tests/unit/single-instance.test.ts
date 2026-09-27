import { describe, expect, it, vi } from 'vitest'
import { createSingleInstance } from 'crinoid/single-instance'

type Listener = (event: unknown, commandLine: readonly string[]) => void

function createApp(acquired = true) {
  const listeners: Listener[] = []
  return {
    app: {
      requestSingleInstanceLock: vi.fn(() => acquired),
      quit: vi.fn(),
      on: vi.fn((_event: 'second-instance', listener: Listener) => {
        listeners.push(listener)
      })
    },
    emit: (commandLine: readonly string[]) => {
      for (const listener of listeners) listener({}, commandLine)
    }
  }
}

describe('single instance', () => {
  it('quits when the instance lock is not acquired', () => {
    const { app } = createApp(false)

    expect(createSingleInstance({ app })).toBe(false)
    expect(app.quit).toHaveBeenCalledTimes(1)
  })

  it('forwards the second-instance command line and focuses the window', () => {
    const { app, emit } = createApp()
    const onSecondInstance = vi.fn()
    const focus = vi.fn()

    expect(createSingleInstance({ app, onSecondInstance, focus })).toBe(true)
    emit(['app', 'myapp://projects/1'])

    expect(onSecondInstance).toHaveBeenCalledWith(['app', 'myapp://projects/1'])
    expect(focus).toHaveBeenCalledTimes(1)
  })
})
