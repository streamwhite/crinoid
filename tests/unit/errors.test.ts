import { describe, expect, it, vi } from 'vitest'
import { installGlobalErrorHandlers, normalizeError } from 'crinoid/errors'
import { createLogger } from 'crinoid/logging'

type Listener = (...args: unknown[]) => void

function createSource() {
  const listeners = new Map<string, Listener[]>()
  return {
    listeners,
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

const silentLogger = createLogger({ sink: { write: () => {} } })

describe('global error handling', () => {
  it('normalizes unknown rejection reasons', () => {
    expect(normalizeError('nope').message).toBe('nope')
    expect(normalizeError({ code: 1 }).message).toBe('{"code":1}')
    expect(normalizeError(new Error('boom')).message).toBe('boom')
  })

  it('reports uncaught exceptions and unhandled rejections', () => {
    const source = createSource()
    const onError = vi.fn()
    installGlobalErrorHandlers({ source, logger: silentLogger, onError })

    source.emit('uncaughtException', new Error('boom'))
    source.emit('unhandledRejection', 'reason')

    expect(onError).toHaveBeenNthCalledWith(1, expect.any(Error), 'uncaughtException')
    expect(onError).toHaveBeenNthCalledWith(2, expect.any(Error), 'unhandledRejection')
  })

  it('removes listeners when disposed', () => {
    const source = createSource()
    const dispose = installGlobalErrorHandlers({ source, logger: silentLogger })

    dispose()

    expect(source.listeners.get('uncaughtException')).toEqual([])
    expect(source.listeners.get('unhandledRejection')).toEqual([])
  })
})
