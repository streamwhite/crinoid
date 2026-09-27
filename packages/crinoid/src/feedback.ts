export type FeedbackCategory = 'bug' | 'feature' | 'question' | 'other'

export interface FeedbackInput {
  readonly message: string
  readonly appVersion: string
  readonly platform: string
  readonly arch: string
  readonly email?: string
  readonly category?: FeedbackCategory
  readonly logs?: readonly string[]
  readonly now?: (() => Date) | undefined
}

export interface FeedbackReport {
  readonly message: string
  readonly appVersion: string
  readonly platform: string
  readonly arch: string
  readonly email?: string
  readonly category?: FeedbackCategory
  readonly logs?: readonly string[]
  readonly createdAt: string
}

const CATEGORIES: readonly FeedbackCategory[] = ['bug', 'feature', 'question', 'other']

export function buildFeedbackReport(input: FeedbackInput): FeedbackReport {
  const message = input.message.trim()
  if (!message) throw new Error('Feedback message is required')
  const now = input.now ?? (() => new Date())
  return {
    message,
    appVersion: input.appVersion,
    platform: input.platform,
    arch: input.arch,
    ...(input.email === undefined ? {} : { email: input.email }),
    ...(input.category === undefined ? {} : { category: input.category }),
    ...(input.logs === undefined ? {} : { logs: input.logs }),
    createdAt: now().toISOString()
  }
}

export function isFeedbackReport(value: unknown): value is FeedbackReport {
  if (typeof value !== 'object' || value === null) return false
  const report = value as Record<string, unknown>
  return (
    typeof report.message === 'string' &&
    report.message.length > 0 &&
    typeof report.appVersion === 'string' &&
    typeof report.platform === 'string' &&
    typeof report.arch === 'string' &&
    typeof report.createdAt === 'string' &&
    (report.category === undefined || (CATEGORIES as readonly unknown[]).includes(report.category))
  )
}
