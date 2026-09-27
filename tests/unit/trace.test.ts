import { describe, expect, it, vi } from 'vitest'
import { createTracer } from 'crinoid/trace'
import { createJobQueue, createTaskContext } from 'crinoid/tasks'

describe('tracer', () => {
  it('records spans with duration and outcome', async () => {
    let now = 0
    const onSpan = vi.fn()
    const tracer = createTracer({ now: () => now, onSpan })

    const result = await tracer.trace('ipc:call', async () => {
      now += 12
      return 'value'
    })

    expect(result).toBe('value')
    expect(onSpan).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ipc:call', durationMs: 12, status: 'ok' })
    )
  })

  it('marks failed spans and rethrows', async () => {
    const onSpan = vi.fn()
    const tracer = createTracer({ onSpan })

    await expect(
      tracer.trace('task:run', async () => {
        throw new Error('bad')
      })
    ).rejects.toThrow('bad')

    expect(onSpan).toHaveBeenCalledWith(expect.objectContaining({ status: 'error', error: 'bad' }))
  })

  it('propagates parent spans and trace ids', async () => {
    const spans: Array<{ name: string; parentId: string | null; traceId: string }> = []
    const tracer = createTracer({ id: (() => {
      let counter = 0
      return () => `id-${++counter}`
    })(), onSpan: (span) => spans.push(span) })

    await tracer.trace('parent', async () => {
      await tracer.trace('child', async () => 'nested')
    })

    expect(spans[0]?.name).toBe('child')
    expect(spans[0]?.parentId).toBe('id-1')
    expect(spans[1]?.name).toBe('parent')
    expect(spans[0]?.traceId).toBe(spans[1]?.traceId)
  })

  it('traces an ipc handler through the wrapper', async () => {
    const spans: string[] = []
    const tracer = createTracer({ onSpan: (span) => spans.push(span.name) })
    const wrapped = tracer.wrapIpc('window.minimize', async (payload) => `handled:${payload}`)

    await expect(wrapped('x')).resolves.toBe('handled:x')
    expect(spans).toContain('ipc:window.minimize')
  })

  it('traces a task through the wrapper', async () => {
    const spans: string[] = []
    const tracer = createTracer({ onSpan: (span) => spans.push(span.name) })
    const wrapped = tracer.wrapTask('export', async () => 42)

    await expect(wrapped()).resolves.toBe(42)
    expect(spans).toContain('task:export')
  })

  it('exposes recent spans for inspection', async () => {
    const tracer = createTracer({ now: () => 0, limit: 2 })
    await tracer.trace('a', async () => {})
    await tracer.trace('b', async () => {})
    await tracer.trace('c', async () => {})

    expect(tracer.spans().map((span) => span.name)).toEqual(['b', 'c'])
  })

  it('traces task context runs through the injected tracer', async () => {
    const spans: string[] = []
    const tracer = createTracer({ onSpan: (span) => spans.push(span.name) })
    const context = createTaskContext({ name: 'export', tracer })

    await expect(context.run(async () => 42)).resolves.toBe(42)
    expect(spans).toContain('task:export')
  })

  it('traces queued jobs through the injected tracer', async () => {
    const spans: string[] = []
    const tracer = createTracer({ onSpan: (span) => spans.push(span.name) })
    const queue = createJobQueue({ tracer })

    await expect(queue.add(async () => 'done', { name: 'sync' })).resolves.toBe('done')
    expect(spans).toContain('task:sync')
  })
})
