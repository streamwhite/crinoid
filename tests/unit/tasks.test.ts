import { describe, expect, it, vi } from 'vitest'
import { createTaskContext, TaskCancelledError } from 'crinoid/tasks'

describe('task context', () => {
  it('reports progress and status transitions', async () => {
    const onProgress = vi.fn()
    const onStatus = vi.fn()
    const context = createTaskContext({ onProgress, onStatus })

    context.progress(0.5)
    await context.run(async () => 'done')

    expect(onProgress).toHaveBeenCalledWith(0.5, undefined)
    expect(onStatus).toHaveBeenCalledWith('running')
    expect(onStatus).toHaveBeenCalledWith('completed')
    expect(context.status()).toBe('completed')
  })

  it('cancels a running task and throws when awaited', async () => {
    const context = createTaskContext({})

    const promise = context.run(async (signal) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (signal.aborted) throw new TaskCancelledError()
      return 'late'
    })
    context.cancel()

    await expect(promise).rejects.toBeInstanceOf(TaskCancelledError)
    expect(context.status()).toBe('cancelled')
  })

  it('forwards an external abort signal', async () => {
    const controller = new AbortController()
    const context = createTaskContext({ signal: controller.signal })

    const promise = context.run(async (signal) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      if (signal.aborted) throw new TaskCancelledError()
    })
    controller.abort()

    await expect(promise).rejects.toBeInstanceOf(TaskCancelledError)
  })

  it('retries a failing task up to the configured attempts', async () => {
    let attempts = 0
    const context = createTaskContext({})

    const result = await context.run(
      async () => {
        attempts += 1
        if (attempts < 3) throw new Error('flaky')
        return 'ok'
      },
      { retries: 3, retryDelayMs: 0 }
    )

    expect(result).toBe('ok')
    expect(attempts).toBe(3)
  })

  it('reports failure after exhausting retries', async () => {
    const onStatus = vi.fn()
    const context = createTaskContext({ onStatus })

    await expect(
      context.run(async () => {
        throw new Error('always')
      }, { retries: 1, retryDelayMs: 0 })
    ).rejects.toThrow('always')

    expect(context.status()).toBe('failed')
    expect(onStatus).toHaveBeenCalledWith('failed')
  })
})
