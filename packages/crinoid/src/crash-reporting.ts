export interface CrashReport {
  readonly message: string
  readonly stack?: string | undefined
  readonly appVersion: string
  readonly platform: string
  readonly time: string
  readonly context?: Record<string, unknown> | undefined
}

export interface CrashReporterOptions {
  readonly onCrash: (report: CrashReport) => void | Promise<void>
  readonly appVersion: string
  readonly platform: string
  readonly now?: (() => Date) | undefined
}

export interface CrashReporter {
  report(error: unknown, context?: Record<string, unknown>): Promise<void>
}

const SECRET_KEY_PATTERN = /(authorization|token|password|secret|apikey|api_key|cookie)/i
const REDACTED = '[redacted]'

export function scrubContext(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => scrubContext(item))
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : scrubContext(item)
    }
    return result
  }
  return value
}

export function createCrashReporter(options: CrashReporterOptions): CrashReporter {
  const now = options.now ?? (() => new Date())

  return {
    report: async (error, context) => {
      const normalized = error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error')
      const report: CrashReport = {
        message: normalized.message,
        stack: normalized.stack,
        appVersion: options.appVersion,
        platform: options.platform,
        time: now().toISOString(),
        ...(context === undefined ? {} : { context: scrubContext(context) as Record<string, unknown> })
      }
      try {
        await options.onCrash(report)
      } catch {
        // crash reporting must never throw
      }
    }
  }
}
