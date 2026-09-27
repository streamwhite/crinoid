export interface ScheduleSpec {
  readonly everyMs?: number
  readonly cron?: string
}

export interface SchedulerOptions {
  readonly now?: (() => number) | undefined
}

export interface Scheduler {
  schedule(id: string, spec: ScheduleSpec, run: () => void | Promise<void>): () => void
  ids(): string[]
  dispose(): void
}

const CRON_FIELDS = 5
const MAX_MINUTES_AHEAD = 366 * 24 * 60

export function nextCronRun(expression: string, from: Date): Date {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== CRON_FIELDS) throw new Error(`Invalid cron expression: ${expression}`)
  const [minutes, hours, days, months, weekdays] = fields as [string, string, string, string, string]
  const candidate = new Date(from.getTime())
  candidate.setUTCSeconds(0, 0)
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)

  for (let step = 0; step < MAX_MINUTES_AHEAD; step += 1) {
    if (
      matches(minutes, candidate.getUTCMinutes()) &&
      matches(hours, candidate.getUTCHours()) &&
      matches(days, candidate.getUTCDate()) &&
      matches(months, candidate.getUTCMonth() + 1) &&
      matches(weekdays, candidate.getUTCDay())
    ) {
      return candidate
    }
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1)
  }
  throw new Error(`Cron expression never matches: ${expression}`)
}

function matches(field: string, value: number): boolean {
  if (field === '*') return true
  for (const part of field.split(',')) {
    const [range, stepValue] = part.split('/')
    const step = stepValue ? Number(stepValue) : 1
    if (!range) continue
    if (range === '*') {
      if (value % step === 0) return true
      continue
    }
    const [startText, endText] = range.split('-')
    const start = Number(startText)
    const end = endText === undefined ? start : Number(endText)
    if (value >= start && value <= end && (value - start) % step === 0) return true
  }
  return false
}

export function createScheduler(options: SchedulerOptions = {}): Scheduler {
  const now = options.now ?? (() => Date.now())
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  const clear = (id: string): void => {
    const timer = timers.get(id)
    if (timer) clearTimeout(timer)
    timers.delete(id)
  }

  const schedule = (id: string, spec: ScheduleSpec, run: () => void | Promise<void>): (() => void) => {
    clear(id)
    const tick = async (): Promise<void> => {
      try {
        await run()
      } finally {
        if (timers.has(id)) arm()
      }
    }
    const arm = (): void => {
      const delayMs = spec.everyMs ?? Math.max(nextCronRun(spec.cron ?? '* * * * *', new Date(now())).getTime() - now(), 0)
      timers.set(id, setTimeout(() => void tick(), delayMs))
    }
    arm()
    return () => clear(id)
  }

  return {
    schedule,
    ids: () => [...timers.keys()],
    dispose: () => {
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }
}
