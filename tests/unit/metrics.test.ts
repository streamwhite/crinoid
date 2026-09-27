import { describe, expect, it, vi } from 'vitest'
import { createMetrics } from 'crinoid/metrics'

describe('metrics', () => {
  it('counts events', () => {
    const metrics = createMetrics()
    metrics.increment('ipc.calls')
    metrics.increment('ipc.calls', 2)

    expect(metrics.counter('ipc.calls')).toBe(3)
    expect(metrics.counter('missing')).toBe(0)
  })

  it('records timing samples and computes percentiles', () => {
    const metrics = createMetrics()
    for (const value of [10, 20, 30, 40, 50]) metrics.observe('ipc.latency', value)

    const summary = metrics.summary('ipc.latency')

    expect(summary.count).toBe(5)
    expect(summary.min).toBe(10)
    expect(summary.max).toBe(50)
    expect(summary.p50).toBe(30)
    expect(summary.p95).toBeGreaterThanOrEqual(40)
    expect(summary.avg).toBe(30)
  })

  it('times a synchronous and asynchronous operation', async () => {
    let now = 0
    const metrics = createMetrics({ now: () => now })
    const sync = metrics.time('work', () => {
      now += 5
      return 'done'
    })
    const async = await metrics.timeAsync('work', async () => {
      now += 7
      return 'async'
    })

    expect(sync).toBe('done')
    expect(async).toBe('async')
    expect(metrics.summary('work').count).toBe(2)
  })

  it('computes an empty summary for unknown metrics', () => {
    expect(createMetrics().summary('nope')).toEqual({ count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0 })
  })

  it('snapshots all metrics and resets', () => {
    const metrics = createMetrics()
    metrics.increment('a')
    metrics.observe('b', 1)

    expect(Object.keys(metrics.snapshot())).toEqual(['a', 'b'])
    metrics.reset()
    expect(metrics.counter('a')).toBe(0)
  })

  it('exposes a metrics listener on record', () => {
    const onRecord = vi.fn()
    const metrics = createMetrics({ onRecord })
    metrics.increment('x')
    metrics.observe('y', 1)

    expect(onRecord).toHaveBeenCalledTimes(2)
  })
})
