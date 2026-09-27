import type { Logger } from './logging.js'

export interface ShutdownTask {
  readonly name: string
  run(): void | Promise<void>
}

export interface ShutdownReport {
  readonly completed: readonly string[]
  readonly failed: readonly string[]
}

export interface ShutdownManagerOptions {
  readonly timeoutMs?: number | undefined
  readonly logger?: Logger | undefined
}

export interface ShutdownManager {
  readonly isShuttingDown: boolean
  register(task: ShutdownTask): () => void
  run(): Promise<ShutdownReport>
}

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000

export function withTimeout<T>(action: Promise<T> | T, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    Promise.resolve(action).then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

export function createShutdownManager(options: ShutdownManagerOptions = {}): ShutdownManager {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS
  const tasks: ShutdownTask[] = []
  let pending: Promise<ShutdownReport> | null = null

  const run = (): Promise<ShutdownReport> => {
    if (pending) return pending
    const snapshot = tasks.slice()
    pending = Promise.all(snapshot.map((task) => runTask(task, timeoutMs, options.logger))).then((results) =>
      summarize(snapshot, results)
    )
    return pending
  }

  return {
    get isShuttingDown() {
      return pending !== null
    },
    register: (task) => {
      tasks.push(task)
      return () => {
        const index = tasks.indexOf(task)
        if (index >= 0) tasks.splice(index, 1)
      }
    },
    run
  }
}

async function runTask(task: ShutdownTask, timeoutMs: number, logger: Logger | undefined): Promise<boolean> {
  try {
    await withTimeout(task.run(), timeoutMs)
    return true
  } catch (error) {
    logger?.warn('Shutdown task failed', { task: task.name, message: errorMessage(error) })
    return false
  }
}

function summarize(tasks: readonly ShutdownTask[], results: readonly boolean[]): ShutdownReport {
  const completed: string[] = []
  const failed: string[] = []
  results.forEach((ok, index) => {
    const task = tasks[index]
    if (!task) return
    if (ok) completed.push(task.name)
    else failed.push(task.name)
  })
  return { completed, failed }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
