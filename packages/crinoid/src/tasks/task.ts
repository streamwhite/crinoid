import type { Tracer } from '../trace.js'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export class TaskCancelledError extends Error {
  constructor(message = 'Task was cancelled') {
    super(message)
    this.name = 'TaskCancelledError'
  }
}

export interface TaskRunOptions {
  readonly retries?: number
  readonly retryDelayMs?: number
}

export interface TaskContextOptions {
  readonly name?: string | undefined
  readonly tracer?: Tracer | undefined
  readonly onProgress?: ((progress: number, detail?: unknown) => void) | undefined
  readonly onStatus?: ((status: TaskStatus) => void) | undefined
  readonly signal?: AbortSignal | undefined
}

export interface TaskContext {
  status(): TaskStatus
  progress(value: number, detail?: unknown): void
  cancel(): void
  run<T>(worker: (signal: AbortSignal) => Promise<T>, options?: TaskRunOptions): Promise<T>
}

const DEFAULT_RETRIES = 0
const DEFAULT_RETRY_DELAY_MS = 0

export function createTaskContext(options: TaskContextOptions): TaskContext {
  const controller = new AbortController()
  let status: TaskStatus = 'pending'

  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const setStatus = (next: TaskStatus): void => {
    status = next
    options.onStatus?.(next)
  }

  const attempt = async <T>(worker: (signal: AbortSignal) => Promise<T>, retries: number, retryDelayMs: number): Promise<T> => {
    let lastError: unknown
    for (let index = 0; index <= retries; index += 1) {
      if (controller.signal.aborted) throw new TaskCancelledError()
      try {
        return await worker(controller.signal)
      } catch (error) {
        if (isCancellation(error, controller.signal)) throw new TaskCancelledError()
        lastError = error
        if (index < retries) await delay(retryDelayMs * 2 ** index)
      }
    }
    throw lastError
  }

  return {
    status: () => status,
    progress: (value, detail) => options.onProgress?.(value, detail),
    cancel: () => controller.abort(),
    run: async (worker, runOptions = {}) => {
      setStatus('running')
      const traced = options.tracer === undefined ? worker : options.tracer.wrapTask(options.name ?? 'task', worker)
      try {
        const result = await attempt(traced, runOptions.retries ?? DEFAULT_RETRIES, runOptions.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS)
        setStatus('completed')
        return result
      } catch (error) {
        setStatus(error instanceof TaskCancelledError ? 'cancelled' : 'failed')
        throw error
      }
    }
  }
}

function isCancellation(error: unknown, signal: AbortSignal): boolean {
  return error instanceof TaskCancelledError || signal.aborted
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
