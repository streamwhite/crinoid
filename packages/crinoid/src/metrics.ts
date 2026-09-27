export interface MetricSummary {
  readonly count: number
  readonly min: number
  readonly max: number
  readonly avg: number
  readonly p50: number
  readonly p95: number
}

export interface MetricRecord {
  readonly name: string
  readonly kind: 'counter' | 'timing'
  readonly value: number
}

export interface MetricsOptions {
  readonly now?: (() => number) | undefined
  readonly onRecord?: ((record: MetricRecord) => void) | undefined
}

export interface Metrics {
  increment(name: string, amount?: number): void
  counter(name: string): number
  observe(name: string, value: number): void
  time<T>(name: string, operation: () => T): T
  timeAsync<T>(name: string, operation: () => Promise<T>): Promise<T>
  summary(name: string): MetricSummary
  snapshot(): Record<string, MetricSummary>
  reset(): void
}

const EMPTY_SUMMARY: MetricSummary = { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0 }

export function createMetrics(options: MetricsOptions = {}): Metrics {
  const now = options.now ?? (() => Date.now())
  const counters = new Map<string, number>()
  const timings = new Map<string, number[]>()

  const record = (name: string, kind: MetricRecord['kind'], value: number): void => {
    options.onRecord?.({ name, kind, value })
  }

  const observe = (name: string, value: number): void => {
    const samples = timings.get(name) ?? []
    samples.push(value)
    timings.set(name, samples)
    record(name, 'timing', value)
  }

  return {
    increment: (name, amount = 1) => {
      counters.set(name, (counters.get(name) ?? 0) + amount)
      record(name, 'counter', amount)
    },
    counter: (name) => counters.get(name) ?? 0,
    observe,
    time: (name, operation) => {
      const start = now()
      const result = operation()
      observe(name, now() - start)
      return result
    },
    timeAsync: async (name, operation) => {
      const start = now()
      try {
        return await operation()
      } finally {
        observe(name, now() - start)
      }
    },
    summary: (name) => summarize(timings.get(name) ?? []),
    snapshot: () => {
      const result: Record<string, MetricSummary> = {}
      for (const [name, count] of counters) result[name] = { ...EMPTY_SUMMARY, count, max: count, avg: count }
      for (const [name, samples] of timings) result[name] = summarize(samples)
      return result
    },
    reset: () => {
      counters.clear()
      timings.clear()
    }
  }
}

function summarize(samples: readonly number[]): MetricSummary {
  if (samples.length === 0) return EMPTY_SUMMARY
  const sorted = [...samples].sort((a, b) => a - b)
  const total = sorted.reduce((sum, value) => sum + value, 0)
  return {
    count: sorted.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    avg: total / sorted.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95)
  }
}

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) return 0
  const index = Math.min(Math.floor(sorted.length * ratio), sorted.length - 1)
  return sorted[index] ?? 0
}
