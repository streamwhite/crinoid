import { describe, expect, it, vi } from 'vitest'
import { createSseClient } from 'crinoid/sse'

class FakeEventSource {
  static instances: FakeEventSource[] = []
  listeners = new Map<string, Set<(event: unknown) => void>>()
  constructor(public readonly url: string) {
    FakeEventSource.instances.push(this)
  }
  addEventListener(event: string, listener: (event: unknown) => void): void {
    const set = this.listeners.get(event) ?? new Set()
    set.add(listener)
    this.listeners.set(event, set)
  }
  removeEventListener(event: string, listener: (event: unknown) => void): void {
    this.listeners.get(event)?.delete(listener)
  }
  emit(event: string, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) listener(payload)
  }
  close(): void {
    this.emit('close')
  }
}

describe('sse client', () => {
  it('connects, forwards events, and tracks status', () => {
    FakeEventSource.instances = []
    const onEvent = vi.fn()
    const client = createSseClient('https://api.example/stream', {
      createEventSource: (url) => new FakeEventSource(url) as never,
      onEvent
    })

    client.connect()
    FakeEventSource.instances[0]?.emit('message', { data: 'payload' })
    FakeEventSource.instances[0]?.emit('open')

    expect(onEvent).toHaveBeenCalledWith('message', 'payload')
    expect(client.status()).toBe('open')
  })

  it('reconnects after an error', () => {
    vi.useFakeTimers()
    try {
      FakeEventSource.instances = []
      const onReconnect = vi.fn()
      const client = createSseClient('https://api.example/stream', {
        createEventSource: (url) => new FakeEventSource(url) as never,
        reconnectDelayMs: 10,
        onReconnect
      })

      client.connect()
      FakeEventSource.instances[0]?.emit('error')
      vi.advanceTimersByTime(20)

      expect(FakeEventSource.instances.length).toBeGreaterThanOrEqual(2)
      expect(onReconnect).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('disposes without reconnecting', () => {
    vi.useFakeTimers()
    try {
      FakeEventSource.instances = []
      const client = createSseClient('https://api.example/stream', {
        createEventSource: (url) => new FakeEventSource(url) as never,
        reconnectDelayMs: 10
      })

      client.connect()
      client.dispose()
      const created = FakeEventSource.instances.length
      FakeEventSource.instances.at(-1)?.emit('error')
      vi.advanceTimersByTime(50)

      expect(FakeEventSource.instances.length).toBe(created)
      expect(client.status()).toBe('closed')
    } finally {
      vi.useRealTimers()
    }
  })
})
