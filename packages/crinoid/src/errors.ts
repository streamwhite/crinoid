import type { Logger } from './logging.js'

export type ErrorScope = 'uncaughtException' | 'unhandledRejection'

type Listener = (...args: unknown[]) => void

export interface ErrorEventSource {
  on(event: ErrorScope, listener: Listener): unknown
  off?(event: ErrorScope, listener: Listener): unknown
}

export interface GlobalErrorHandlersOptions {
  readonly source: ErrorEventSource
  readonly logger: Logger
  readonly onError?: ((error: Error, scope: ErrorScope) => void) | undefined
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  return new Error(serialize(error))
}

export function installGlobalErrorHandlers(options: GlobalErrorHandlersOptions): () => void {
  const report = (scope: ErrorScope, error: unknown): void => {
    const normalized = normalizeError(error)
    options.logger.error(`Global error: ${scope}`, { message: normalized.message, stack: normalized.stack })
    options.onError?.(normalized, scope)
  }

  const onUncaughtException: Listener = (error) => report('uncaughtException', error)
  const onUnhandledRejection: Listener = (reason) => report('unhandledRejection', reason)

  options.source.on('uncaughtException', onUncaughtException)
  options.source.on('unhandledRejection', onUnhandledRejection)

  return () => {
    options.source.off?.('uncaughtException', onUncaughtException)
    options.source.off?.('unhandledRejection', onUnhandledRejection)
  }
}

function serialize(error: unknown): string {
  try {
    return JSON.stringify(error) ?? 'Unknown error'
  } catch {
    return 'Unknown error'
  }
}
