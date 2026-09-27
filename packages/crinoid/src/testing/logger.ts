import type { LogLevel, LogRecord, Logger } from '../logging.js'

export interface CollectingLogger {
  readonly logger: Logger
  readonly records: LogRecord[]
  messages(level: LogLevel): string[]
}

export function createCollectingLogger(): CollectingLogger {
  const records: LogRecord[] = []
  const write = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
    records.push({ level, message, time: new Date().toISOString(), ...(context === undefined ? {} : { context }) })
  }
  return {
    records,
    messages: (level) => records.filter((record) => record.level === level).map((record) => record.message),
    logger: {
      debug: (message, context) => write('debug', message, context),
      info: (message, context) => write('info', message, context),
      warn: (message, context) => write('warn', message, context),
      error: (message, context) => write('error', message, context),
      flush: async () => {}
    }
  }
}
