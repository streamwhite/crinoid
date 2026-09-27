import { describe, expect, it, vi } from 'vitest'
import { createScheduler, nextCronRun } from 'crinoid/tasks'

describe('cron parsing', () => {
  it('computes the next run for a daily schedule', () => {
    const from = new Date('2024-01-01T00:00:00.000Z')
    const next = nextCronRun('0 9 * * *', from)

    expect(next.toISOString()).toBe('2024-01-01T09:00:00.000Z')
  })

  it('computes the next run for an every-15-minutes schedule', () => {
    const from = new Date('2024-01-01T00:00:00.000Z')
    const next = nextCronRun('*/15 * * * *', from)

    expect(next.toISOString()).toBe('2024-01-01T00:15:00.000Z')
  })

  it('rejects an invalid expression', () => {
    expect(() => nextCronRun('not a cron', new Date())).toThrow('cron')
  })
})

describe('scheduler', () => {
  it('runs a scheduled job on each interval', async () => {
    vi.useFakeTimers()
    try {
      const run = vi.fn(async () => {})
      const scheduler = createScheduler({ now: () => Date.now() })
      scheduler.schedule('ping', { everyMs: 100 }, run)

      await vi.advanceTimersByTimeAsync(350)

      expect(run.mock.calls.length).toBeGreaterThanOrEqual(3)
      scheduler.dispose()
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels a scheduled job', async () => {
    vi.useFakeTimers()
    try {
      const run = vi.fn(async () => {})
      const scheduler = createScheduler({ now: () => Date.now() })
      const cancel = scheduler.schedule('ping', { everyMs: 100 }, run)

      cancel()
      await vi.advanceTimersByTimeAsync(300)

      expect(run).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('exposes registered job ids', () => {
    const scheduler = createScheduler({ now: () => Date.now() })
    scheduler.schedule('a', { everyMs: 1000 }, async () => {})
    scheduler.schedule('b', { everyMs: 1000 }, async () => {})

    expect(scheduler.ids().sort()).toEqual(['a', 'b'])
    scheduler.dispose()
  })
})
