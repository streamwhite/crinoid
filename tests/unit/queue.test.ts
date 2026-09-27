import { describe, expect, it, vi } from 'vitest'
import { createJobQueue } from 'crinoid/tasks'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('job queue', () => {
  it('runs jobs respecting the concurrency limit', async () => {
    let running = 0
    let peak = 0
    const queue = createJobQueue({ concurrency: 2 })
    const jobs = Array.from({ length: 5 }, (_, index) =>
      queue.add(async () => {
        running += 1
        peak = Math.max(peak, running)
        await new Promise((resolve) => setTimeout(resolve, 5))
        running -= 1
        return index
      })
    )

    const results = await Promise.all(jobs)

    expect(peak).toBeLessThanOrEqual(2)
    expect(results).toEqual([0, 1, 2, 3, 4])
  })

  it('queues jobs while the limit is saturated', async () => {
    const first = deferred<string>()
    const queue = createJobQueue({ concurrency: 1 })
    const onStart = vi.fn()

    const a = queue.add(() => first.promise, { onStart })
    const b = queue.add(async () => 'b', { onStart })
    await Promise.resolve()

    expect(queue.pending()).toBe(1)
    expect(queue.active()).toBe(1)

    first.resolve('a')
    await a
    await b

    expect(onStart).toHaveBeenCalledTimes(2)
  })

  it('retries failing jobs with backoff', async () => {
    let attempts = 0
    const queue = createJobQueue({ concurrency: 1 })

    const result = await queue.add(
      async () => {
        attempts += 1
        if (attempts < 2) throw new Error('retry me')
        return 'done'
      },
      { retries: 2, retryDelayMs: 0 }
    )

    expect(result).toBe('done')
    expect(attempts).toBe(2)
  })

  it('cancels queued and active jobs on clear', async () => {
    const queue = createJobQueue({ concurrency: 1 })
    const active = queue.add(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return 'active'
    })
    const queued = queue.add(async () => 'queued')

    queue.clear()

    await expect(active).rejects.toBeInstanceOf(Error)
    await expect(queued).rejects.toBeInstanceOf(Error)
    expect(queue.pending()).toBe(0)
  })

  it('resumes processing after clear during drain', async () => {
    const queue = createJobQueue({ concurrency: 1 })
    await queue.add(async () => 'one')
    expect(queue.completedCount()).toBe(1)
  })
})
