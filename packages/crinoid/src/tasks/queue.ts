import { TaskCancelledError } from './task.js'
import type { TaskRunOptions } from './task.js'
import type { Tracer } from '../trace.js'

export interface JobOptions extends TaskRunOptions {
  readonly name?: string | undefined
  readonly onProgress?: ((progress: number) => void) | undefined
  readonly onStart?: (() => void) | undefined
}

export interface JobQueueOptions {
  readonly concurrency?: number
  readonly tracer?: Tracer | undefined
}

export interface JobQueue {
  add<R>(worker: (signal: AbortSignal) => Promise<R> | R, options?: JobOptions): Promise<R>
  pending(): number
  active(): number
  completedCount(): number
  clear(): void
  onIdle(): Promise<void>
}

const DEFAULT_CONCURRENCY = 4

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface QueuedJob {
  readonly start: () => void
  readonly cancel: () => void
}

export function createJobQueue(options: JobQueueOptions = {}): JobQueue {
  const concurrency = Math.max(options.concurrency ?? DEFAULT_CONCURRENCY, 1)
  const waiting: QueuedJob[] = []
  const active = new Set<QueuedJob>()
  let activeCount = 0
  let completed = 0
  let idleResolvers: Array<() => void> = []

  const settleIdle = (): void => {
    if (activeCount === 0 && waiting.length === 0 && idleResolvers.length > 0) {
      const resolvers = idleResolvers
      idleResolvers = []
      for (const resolve of resolvers) resolve()
    }
  }

  const pump = (): void => {
    while (activeCount < concurrency && waiting.length > 0) {
      const job = waiting.shift()
      if (!job) break
      job.start()
    }
  }

  const add = <R>(worker: (signal: AbortSignal) => Promise<R> | R, jobOptions: JobOptions = {}): Promise<R> => {
    const run = options.tracer === undefined ? worker : options.tracer.wrapTask(jobOptions.name ?? 'job', worker)
    return new Promise<R>((resolve, reject) => {
      const controller = new AbortController()
      let settled = false
      let started = false

      const finish = (callback: () => void): void => {
        if (settled) return
        settled = true
        if (started) {
          activeCount -= 1
          active.delete(job)
        }
        callback()
        pump()
        settleIdle()
      }

      const start = (): void => {
        started = true
        activeCount += 1
        active.add(job)
        jobOptions.onStart?.()
        const retries = jobOptions.retries ?? 0
        const retryDelayMs = jobOptions.retryDelayMs ?? 0
        const attempt = (index: number): Promise<unknown> => {
          if (controller.signal.aborted) return Promise.reject(new TaskCancelledError())
          return Promise.resolve()
            .then(() => run(controller.signal))
            .catch((error: unknown) => {
              if (controller.signal.aborted) throw new TaskCancelledError()
              if (index >= retries) throw error
              return delay(retryDelayMs * 2 ** index).then(() => attempt(index + 1))
            })
        }
        void attempt(0)
          .then((value) =>
            finish(() => {
              if (controller.signal.aborted) reject(new TaskCancelledError())
              else {
                completed += 1
                resolve(value as R)
              }
            })
          )
          .catch((error: unknown) => finish(() => reject(controller.signal.aborted ? new TaskCancelledError() : error)))
      }

      const cancel = (): void => {
        controller.abort()
        finish(() => reject(new TaskCancelledError()))
      }

      const job: QueuedJob = { start, cancel }

      if (activeCount < concurrency) start()
      else waiting.push(job)
    })
  }

  return {
    add,
    pending: () => waiting.length,
    active: () => activeCount,
    completedCount: () => completed,
    clear: () => {
      for (const job of waiting.splice(0)) job.cancel()
      for (const job of active) job.cancel()
      settleIdle()
    },
    onIdle: () =>
      new Promise<void>((resolve) => {
        if (activeCount === 0 && waiting.length === 0) resolve()
        else idleResolvers.push(resolve)
      })
  }
}
