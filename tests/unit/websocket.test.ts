import { describe, expect, it, vi } from 'vitest'
import { createWebSocketClient } from 'crinoid/websocket'

class FakeSocket {
  static instances: FakeSocket[] = []
  listeners = new Map<string, Set<(event: unknown) => void>>()
  sent: string[] = []
  readyState = 0
  constructor(public readonly url: string) {
    FakeSocket.instances.push(this)
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
  send(data: string): void {
    this.sent.push(data)
  }
  close(): void {
    this.readyState = 3
    this.emit('close')
  }
}

const ALLOWED = new Set(['wss:'])

describe('websocket client', () => {
  it('connects and forwards messages', () => {
    FakeSocket.instances = []
    const onMessage = vi.fn()
    const client = createWebSocketClient('wss://example.com/socket', {
      createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
      isAllowedUrl: (url) => ALLOWED.has(new URL(url).protocol),
      onMessage
    })

    client.connect()
    FakeSocket.instances[0]?.emit('open')
    FakeSocket.instances[0]?.emit('message', { data: 'hello' })

    expect(client.status()).toBe('open')
    expect(onMessage).toHaveBeenCalledWith('hello')
  })

  it('rejects disallowed protocols', () => {
    const client = createWebSocketClient('ws://example.com', {
      createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
      isAllowedUrl: (url) => ALLOWED.has(new URL(url).protocol)
    })

    expect(() => client.connect()).toThrow('not allowed')
  })

  it('queues messages until the socket is open', () => {
    FakeSocket.instances = []
    const client = createWebSocketClient('wss://example.com/socket', {
      createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
      isAllowedUrl: () => true
    })

    client.send('early')
    expect(FakeSocket.instances).toHaveLength(0)

    client.connect()
    FakeSocket.instances[0]?.emit('open')

    expect(FakeSocket.instances[0]?.sent).toEqual(['early'])
  })

  it('schedules a reconnect after close with backoff', () => {
    vi.useFakeTimers()
    try {
      FakeSocket.instances = []
      const onReconnect = vi.fn()
      const client = createWebSocketClient('wss://example.com/socket', {
        createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
        isAllowedUrl: () => true,
        reconnectDelayMs: 10,
        onReconnect
      })

      client.connect()
      FakeSocket.instances[0]?.emit('close')
      vi.advanceTimersByTime(20)

      expect(FakeSocket.instances.length).toBeGreaterThanOrEqual(2)
      expect(onReconnect).toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops reconnecting after dispose', () => {
    vi.useFakeTimers()
    try {
      FakeSocket.instances = []
      const client = createWebSocketClient('wss://example.com/socket', {
        createSocket: (url) => new FakeSocket(url) as unknown as WebSocket,
        isAllowedUrl: () => true,
        reconnectDelayMs: 10
      })

      client.connect()
      client.dispose()
      const created = FakeSocket.instances.length
      FakeSocket.instances.at(-1)?.emit('close')
      vi.advanceTimersByTime(50)

      expect(FakeSocket.instances.length).toBe(created)
    } finally {
      vi.useRealTimers()
    }
  })
})
