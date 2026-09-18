export interface Logger { debug(message: string, context?: Record<string, unknown>): void; info(message: string, context?: Record<string, unknown>): void; warn(message: string, context?: Record<string, unknown>): void; error(message: string, context?: Record<string, unknown>): void }

function write(level: string, message: string, context?: Record<string, unknown>): void { console[level as 'log'](JSON.stringify({ level, message, ...context })) }

export const logger: Logger = { debug: (message, context) => write('debug', message, context), info: (message, context) => write('info', message, context), warn: (message, context) => write('warn', message, context), error: (message, context) => write('error', message, context) }
