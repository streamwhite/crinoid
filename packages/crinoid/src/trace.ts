export type SpanStatus = 'ok' | 'error'

export interface Span {
  readonly id: string
  readonly traceId: string
  readonly parentId: string | null
  readonly name: string
  readonly durationMs: number
  readonly status: SpanStatus
  readonly error?: string | undefined
}

export interface TracerOptions {
  readonly now?: (() => number) | undefined
  readonly id?: (() => string) | undefined
  readonly onSpan?: ((span: Span) => void) | undefined
  readonly limit?: number | undefined
}

export interface Tracer {
  trace<T>(name: string, operation: () => Promise<T> | T): Promise<T>
  wrapIpc<Args extends unknown[], Result>(channel: string, handler: (...args: Args) => Promise<Result> | Result): (...args: Args) => Promise<Result>
  wrapTask<Args extends unknown[], Result>(name: string, task: (...args: Args) => Promise<Result> | Result): (...args: Args) => Promise<Result>
  spans(): readonly Span[]
}

const DEFAULT_LIMIT = 100

export function createTracer(options: TracerOptions = {}): Tracer {
  const now = options.now ?? (() => Date.now())
  const id = options.id ?? (() => crypto.randomUUID())
  const limit = options.limit ?? DEFAULT_LIMIT
  const recent: Span[] = []
  let currentTrace: { traceId: string; parentId: string | null } | null = null

  const trace = async <T>(name: string, operation: () => Promise<T> | T): Promise<T> => {
    const parent = currentTrace
    const spanId = id()
    const traceId = parent?.traceId ?? spanId
    const parentId = parent?.parentId ?? null
    const start = now()
    currentTrace = { traceId, parentId: spanId }
    try {
      const result = await operation()
      finish(spanId, traceId, parentId, name, start, 'ok')
      return result
    } catch (error) {
      finish(spanId, traceId, parentId, name, start, 'error', errorMessage(error))
      throw error
    } finally {
      currentTrace = parent
    }
  }

  const finish = (
    spanId: string,
    traceId: string,
    parentId: string | null,
    name: string,
    start: number,
    status: SpanStatus,
    error?: string
  ): void => {
    const span: Span = {
      id: spanId,
      traceId,
      parentId,
      name,
      durationMs: now() - start,
      status,
      ...(error === undefined ? {} : { error })
    }
    recent.push(span)
    if (recent.length > limit) recent.shift()
    options.onSpan?.(span)
  }

  return {
    trace,
    wrapIpc: (channel, handler) => (...args) => trace(`ipc:${channel}`, () => handler(...args)),
    wrapTask: (name, task) => (...args) => trace(`task:${name}`, () => task(...args)),
    spans: () => [...recent]
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}
