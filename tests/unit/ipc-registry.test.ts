import { describe, expect, it, vi } from 'vitest'
import {
  DESKTOP_CHANNELS,
  createChannel,
  createIpcInvoker,
  createIpcRegistry
} from 'crinoid/ipc'
import { createMetrics } from 'crinoid/metrics'
import { createTracer } from 'crinoid/trace'

type IpcEvent = { sender: { getURL(): string } }
type Handler = (event: IpcEvent, ...args: unknown[]) => unknown

function createFakeIpcMain() {
  const handlers = new Map<string, Handler>()
  return {
    handlers,
    handle(channel: string, listener: Handler) {
      handlers.set(channel, listener)
    },
    removeHandler(channel: string) {
      handlers.delete(channel)
    }
  }
}

const echo = createChannel<{ id: string }, string>(
  'feature.echo',
  (value): value is { id: string } => typeof (value as { id?: unknown })?.id === 'string'
)

const trusted = { sender: { getURL: () => 'file:///app/index.html' } }
const untrusted = { sender: { getURL: () => 'https://evil.example' } }

describe('ipc registry', () => {
  it('registers handlers and enforces trust and payload validation', async () => {
    const ipcMain = createFakeIpcMain()
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: echo, handle: ({ request }) => request.id })

    const handler = ipcMain.handlers.get('feature.echo')!
    await expect(handler(trusted, { id: '1' })).resolves.toBe('1')
    await expect(handler(untrusted, { id: '1' })).rejects.toThrow('Untrusted')
    await expect(handler(trusted, {})).rejects.toThrow('Invalid')
  })

  it('rejects duplicate channel registration', () => {
    const ipcMain = createFakeIpcMain()
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: echo, handle: () => 'ok' })

    expect(() => registry.register({ channel: echo, handle: () => 'ok' })).toThrow('already registered')
  })

  it('removes handlers when disposed', () => {
    const ipcMain = createFakeIpcMain()
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: echo, handle: () => 'ok' })

    registry.dispose()

    expect(ipcMain.handlers.has('feature.echo')).toBe(false)
  })

  it('builds a typed renderer invoker', async () => {
    const invoke = vi.fn().mockResolvedValue('result')
    const call = createIpcInvoker(echo, { invoke })

    await expect(call({ id: '9' })).resolves.toBe('result')
    expect(invoke).toHaveBeenCalledWith('feature.echo', { id: '9' })
  })

  it('traces and measures registered channels', async () => {
    const ipcMain = createFakeIpcMain()
    const spans: string[] = []
    const metrics = createMetrics()
    const registry = createIpcRegistry(ipcMain, {
      origin: 'file:',
      tracer: createTracer({ onSpan: (span) => spans.push(span.name) }),
      metrics
    })
    registry.register({ channel: echo, handle: ({ request }) => request.id })

    const handler = ipcMain.handlers.get('feature.echo')!
    await handler(trusted, { id: '1' })

    expect(spans).toContain('ipc:feature.echo')
    expect(metrics.counter('ipc.calls')).toBe(1)
    expect(metrics.summary('ipc.duration').count).toBe(1)
  })

  it('validates feedback submissions before they reach the handler', async () => {
    const ipcMain = createFakeIpcMain()
    const received: unknown[] = []
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({
      channel: DESKTOP_CHANNELS.submitFeedback,
      handle: ({ request }) => {
        received.push(request)
        return true
      }
    })

    const handler = ipcMain.handlers.get('feedback.submit')!
    await expect(handler(trusted, { message: 'needs work' })).resolves.toBe(true)
    await expect(handler(trusted, { message: '   ' })).rejects.toThrow('Invalid')
    expect(received).toEqual([{ message: 'needs work' }])
  })

  it('validates renderer crash reports', async () => {
    const ipcMain = createFakeIpcMain()
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: DESKTOP_CHANNELS.crashReport, handle: () => true })

    const handler = ipcMain.handlers.get('crash.report')!
    await expect(handler(trusted, { message: 'render exploded', context: { route: '/home' } })).resolves.toBe(true)
    await expect(handler(trusted, { message: '' })).rejects.toThrow('Invalid')
  })
})
