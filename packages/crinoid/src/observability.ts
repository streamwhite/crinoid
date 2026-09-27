import { createCrashReporter, type CrashReport, type CrashReporter } from './crash-reporting.js'
import { buildFeedbackReport, type FeedbackCategory, type FeedbackReport } from './feedback.js'
import {
  createConsoleSink,
  createLogger,
  createMultiSink,
  createRotatingFileSink,
  type LogLevel,
  type LogSink,
  type Logger
} from './logging.js'
import { createMetrics, type Metrics } from './metrics.js'
import { createTracer, type Tracer } from './trace.js'

export interface ObservabilityOptions {
  readonly appVersion: string
  readonly platform: string
  readonly arch: string
  readonly level?: LogLevel | undefined
  readonly logger?: Logger | undefined
  readonly logFile?: string | undefined
  readonly maxLogBytes?: number | undefined
  readonly maxLogFiles?: number | undefined
  readonly onCrash?: ((report: CrashReport) => void | Promise<void>) | undefined
  readonly onFeedback?: ((report: FeedbackReport) => void | Promise<void>) | undefined
  readonly now?: (() => Date) | undefined
  readonly traceLimit?: number | undefined
}

export interface FeedbackSubmission {
  readonly message: string
  readonly category?: FeedbackCategory | undefined
  readonly email?: string | undefined
  readonly logs?: readonly string[] | undefined
}

export interface Observability {
  readonly logger: Logger
  readonly metrics: Metrics
  readonly tracer: Tracer
  readonly crashReporter: CrashReporter
  reportCrash(error: unknown, context?: Record<string, unknown>): Promise<void>
  submitFeedback(submission: FeedbackSubmission): Promise<FeedbackReport>
}

const TRACE_DURATION_METRIC = 'trace.duration'
const TRACE_ERROR_METRIC = 'trace.errors'
const DEFAULT_TRACE_LIMIT = 200

function buildSinks(options: ObservabilityOptions): LogSink {
  const sinks: LogSink[] = [createConsoleSink()]
  if (options.logFile !== undefined) {
    sinks.push(
      createRotatingFileSink({
        filePath: options.logFile,
        ...(options.maxLogBytes === undefined ? {} : { maxBytes: options.maxLogBytes }),
        ...(options.maxLogFiles === undefined ? {} : { maxFiles: options.maxLogFiles })
      })
    )
  }
  return createMultiSink(sinks)
}

function defaultCrashHandler(logger: Logger): (report: CrashReport) => void {
  return (report) => logger.error('Unhandled crash', { message: report.message, stack: report.stack })
}

export function createObservability(options: ObservabilityOptions): Observability {
  const logger =
    options.logger ??
    createLogger({ level: options.level ?? 'info', sink: buildSinks(options), ...(options.now === undefined ? {} : { now: options.now }) })
  const metrics = createMetrics()
  const tracer = createTracer({
    limit: options.traceLimit ?? DEFAULT_TRACE_LIMIT,
    ...(options.now === undefined ? {} : { now: () => options.now?.().getTime() ?? Date.now() }),
    onSpan: (span) => {
      metrics.observe(TRACE_DURATION_METRIC, span.durationMs)
      if (span.status === 'error') metrics.increment(TRACE_ERROR_METRIC)
    }
  })
  const crashReporter = createCrashReporter({
    appVersion: options.appVersion,
    platform: options.platform,
    onCrash: options.onCrash ?? defaultCrashHandler(logger),
    ...(options.now === undefined ? {} : { now: options.now })
  })

  const submitFeedback = async (submission: FeedbackSubmission): Promise<FeedbackReport> => {
    const report = buildFeedbackReport({
      message: submission.message,
      appVersion: options.appVersion,
      platform: options.platform,
      arch: options.arch,
      ...(submission.email === undefined ? {} : { email: submission.email }),
      ...(submission.category === undefined ? {} : { category: submission.category }),
      ...(submission.logs === undefined ? {} : { logs: submission.logs }),
      ...(options.now === undefined ? {} : { now: options.now })
    })
    const sink = options.onFeedback
    if (sink) {
      try {
        await sink(report)
      } catch {
        logger.warn('Feedback sink failed', { message: report.message })
      }
    } else {
      logger.info('User feedback received', { category: report.category ?? 'other', message: report.message })
    }
    return report
  }

  return {
    logger,
    metrics,
    tracer,
    crashReporter,
    reportCrash: (error, context) => crashReporter.report(error, context),
    submitFeedback
  }
}
