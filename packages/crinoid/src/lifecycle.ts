import type { Logger } from './logging.js'
import { createShutdownManager, type ShutdownManager } from './shutdown.js'

export { DEFAULT_SHUTDOWN_TIMEOUT_MS, createShutdownManager, withTimeout } from './shutdown.js'
export type { ShutdownManager, ShutdownReport, ShutdownTask } from './shutdown.js'

type Listener = (...args: unknown[]) => void

export interface AppEventTarget {
  on(event: string, listener: Listener): unknown
  off?(event: string, listener: Listener): unknown
  quit(): void
}

export interface LifecycleOptions {
  readonly app: AppEventTarget
  readonly onReady: () => void | Promise<void>
  readonly onActivate?: (() => void | Promise<void>) | undefined
  readonly logger?: Logger | undefined
  readonly isMacOS?: boolean | undefined
  readonly shutdownTimeoutMs?: number | undefined
  readonly shutdown?: ShutdownManager | undefined
}

export interface Lifecycle {
  readonly shutdown: ShutdownManager
  readonly isQuitting: boolean
  dispose(): void
}

export function createAppLifecycle(options: LifecycleOptions): Lifecycle {
  const logger = options.logger
  const isMacOS = options.isMacOS ?? process.platform === 'darwin'
  const shutdown =
    options.shutdown ??
    createShutdownManager({ timeoutMs: options.shutdownTimeoutMs, logger: options.logger })
  const listeners = new Map<string, Listener>()
  let quitting = false

  const register = (event: string, listener: Listener): void => {
    listeners.set(event, listener)
    options.app.on(event, listener)
  }

  const reportFailure = (scope: string) => (error: unknown) =>
    logger?.error(`Lifecycle ${scope} handler failed`, { message: errorMessage(error) })

  const handleQuit = (event: unknown): void => {
    if (quitting) return
    quitting = true
    preventDefault(event)
    void shutdown.run().finally(() => options.app.quit())
  }

  register('ready', () => {
    void Promise.resolve(options.onReady()).catch(reportFailure('ready'))
  })
  register('before-quit', handleQuit)
  register('window-all-closed', () => {
    if (!isMacOS) options.app.quit()
  })
  if (options.onActivate) {
    const onActivate = options.onActivate
    register('activate', () => {
      void Promise.resolve(onActivate()).catch(reportFailure('activate'))
    })
  }

  return {
    shutdown,
    get isQuitting() {
      return quitting
    },
    dispose: () => {
      for (const [event, listener] of listeners) options.app.off?.(event, listener)
      listeners.clear()
    }
  }
}

function preventDefault(event: unknown): void {
  const candidate = event as { preventDefault?: () => void } | undefined
  if (typeof candidate?.preventDefault === 'function') candidate.preventDefault()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
