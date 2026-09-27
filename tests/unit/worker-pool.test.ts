import { describe, expect, it, vi } from 'vitest'
import { createWorkerPool } from 'crinoid/tasks'

interface FakeWorker {
  postMessage(message: unknown): void
  terminate(): void
}

function createFakeWorkerFactory() {
  const workers: FakeWorker[] = []
  const factory = () => {
    let handler: ((message: unknown) => void) | null = null
    const worker: FakeWorker = {
      postMessage: (message) => {
        const request = message as { id: number; payload: number }
        setTimeout(() => handler?.({ id: request.id, result: request.payload * 2 }), 0)
      },
      terminate: vi.fn()
    }
    workers.push(worker)
    return {
      worker,
      onMessage: (listener: (message: unknown) => void) => {
        handler = listener
      }
    }
  }
  return { factory, workers }
}

describe('worker pool', () => {
  it('runs a task on a worker and resolves the result', async () => {
    const { factory } = createFakeWorkerFactory()
    const pool = createWorkerPool<number, number>({ size: 2, createWorker: factory })

    await expect(pool.run(21)).resolves.toBe(42)
    pool.dispose()
  })

  it('reuses workers across tasks', async () => {
    const { factory, workers } = createFakeWorkerFactory()
    const pool = createWorkerPool<number, number>({ size: 1, createWorker: factory })

    await pool.run(1)
    await pool.run(2)

    expect(workers).toHaveLength(1)
    pool.dispose()
  })

  it('terminates all workers on dispose', async () => {
    const { factory, workers } = createFakeWorkerFactory()
    const pool = createWorkerPool<number, number>({ size: 2, createWorker: factory })

    await Promise.all([pool.run(1), pool.run(2)])
    pool.dispose()

    expect(workers).toHaveLength(2)
    for (const worker of workers) expect(worker.terminate).toHaveBeenCalled()
  })

  it('rejects when the worker reports an error', async () => {
    const factory = () => {
      let handler: ((message: unknown) => void) | null = null
      const worker: FakeWorker = {
        postMessage: () => {
          setTimeout(() => handler?.({ id: 1, error: 'boom' }), 0)
        },
        terminate: vi.fn()
      }
      return {
        worker,
        onMessage: (listener: (message: unknown) => void) => {
          handler = listener
        }
      }
    }
    const pool = createWorkerPool<number, number>({ size: 1, createWorker: factory })

    await expect(pool.run(1)).rejects.toThrow('boom')
    pool.dispose()
  })
})
