import { describe, expect, it, vi } from 'vitest'
import { createShutdownManager, withTimeout } from 'crinoid/lifecycle'

describe('shutdown manager', () => {
  it('runs registered tasks once even when called repeatedly', async () => {
    const manager = createShutdownManager()
    const run = vi.fn()
    manager.register({ name: 'database', run })

    const first = manager.run()
    const second = manager.run()

    expect(first).toBe(second)
    await first
    expect(run).toHaveBeenCalledTimes(1)
    expect(manager.isShuttingDown).toBe(true)
  })

  it('isolates failing tasks from the rest', async () => {
    const manager = createShutdownManager()
    manager.register({ name: 'ok', run: () => {} })
    manager.register({
      name: 'bad',
      run: () => {
        throw new Error('boom')
      }
    })

    const report = await manager.run()

    expect(report.completed).toEqual(['ok'])
    expect(report.failed).toEqual(['bad'])
  })

  it('supports unregistering a task before shutdown', async () => {
    const manager = createShutdownManager()
    const remove = manager.register({ name: 'temporary', run: () => {} })

    remove()

    const report = await manager.run()
    expect(report.completed).toEqual([])
  })
})

describe('withTimeout', () => {
  it('rejects when a task exceeds the timeout', async () => {
    await expect(withTimeout(new Promise(() => {}), 5)).rejects.toThrow('timed out')
  })

  it('resolves when a task settles in time', async () => {
    await expect(withTimeout(Promise.resolve('done'), 50)).resolves.toBe('done')
  })
})
