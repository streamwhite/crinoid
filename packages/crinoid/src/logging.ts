export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export interface LogRecord {
  readonly level: LogLevel
  readonly message: string
  readonly time: string
  readonly context?: Record<string, unknown>
}

export interface LogSink {
  write(record: LogRecord): void
  flush?(): Promise<void>
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
  flush(): Promise<void>
}

export type ConsoleLike = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>

export interface LoggerOptions {
  readonly level?: LogLevel | undefined
  readonly sink?: LogSink | undefined
  readonly now?: (() => Date) | undefined
}

const DEFAULT_LEVEL: LogLevel = 'info'

export function levelFromEnvironment(environment: string): LogLevel {
  return environment === 'production' ? 'info' : 'debug'
}

export function createConsoleSink(target: ConsoleLike = console): LogSink {
  return {
    write: (record) => {
      target[record.level](JSON.stringify(record))
    }
  }
}

export function createMultiSink(sinks: readonly LogSink[]): LogSink {
  return {
    write: (record) => {
      for (const sink of sinks) sink.write(record)
    },
    flush: async () => {
      await Promise.all(sinks.map((sink) => sink.flush?.() ?? Promise.resolve()))
    }
  }
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const level = options.level ?? DEFAULT_LEVEL
  const sink = options.sink ?? createConsoleSink()
  const now = options.now ?? (() => new Date())

  const log = (recordLevel: LogLevel, message: string, context?: Record<string, unknown>): void => {
    if (LEVEL_WEIGHT[recordLevel] < LEVEL_WEIGHT[level]) return
    const record: LogRecord = {
      level: recordLevel,
      message,
      time: now().toISOString(),
      ...(context === undefined ? {} : { context })
    }
    sink.write(record)
  }

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
    flush: async () => {
      await sink.flush?.()
    }
  }
}

export const logger: Logger = createLogger()

export { createRotatingFileSink } from './logging/file.js'
export type { RotatingFileSinkOptions } from './logging/file.js'
