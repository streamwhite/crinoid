export type TextDirection = 'ltr' | 'rtl'

export const RTL_LOCALES: readonly string[] = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'dv']

export interface LocaleDetectionInput {
  readonly preference?: string | null | undefined
  readonly system?: string | null | undefined
  readonly available?: readonly string[] | undefined
  readonly fallback?: string | undefined
}

export interface ResolvedLocale {
  readonly locale: string
  readonly direction: TextDirection
  readonly isRtl: boolean
}

export function normalizeLocale(value: string): string {
  return value.replace('_', '-').replace(/^([a-zA-Z]+)-([a-zA-Z]+)$/, (_match, language: string, region: string) => `${language.toLowerCase()}-${region.toUpperCase()}`)
}

export function detectLocale(input: LocaleDetectionInput): string {
  const available = input.available ?? []
  const candidates = [input.preference, input.system].filter((value): value is string => Boolean(value))
  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate)
    const exact = available.find((locale) => normalizeLocale(locale) === normalized)
    if (exact) return exact
    const language = normalized.split('-')[0] ?? normalized
    const byLanguage = available.find((locale) => normalizeLocale(locale).split('-')[0] === language)
    if (byLanguage) return byLanguage
  }
  return input.fallback ?? available[0] ?? 'en'
}

export function directionForLocale(locale: string): TextDirection {
  const language = normalizeLocale(locale).split('-')[0] ?? locale
  return RTL_LOCALES.includes(language) ? 'rtl' : 'ltr'
}

export function resolveLocale(locale: string): ResolvedLocale {
  const direction = directionForLocale(locale)
  return { locale: normalizeLocale(locale), direction, isRtl: direction === 'rtl' }
}

export interface FormattersOptions {
  readonly timeZone?: string
}

export interface Formatters {
  readonly locale: string
  readonly timeZone: string
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string
  formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string
  formatPercent(value: number, options?: Intl.NumberFormatOptions): string
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string
  formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, options?: Intl.RelativeTimeFormatOptions): string
}

export function createFormatters(locale: string, options: FormattersOptions = {}): Formatters {
  const resolved = normalizeLocale(locale)
  const timeZone = options.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone

  return {
    locale: resolved,
    timeZone,
    formatNumber: (value, formatOptions) => new Intl.NumberFormat(resolved, formatOptions).format(value),
    formatCurrency: (value, currency, formatOptions) =>
      new Intl.NumberFormat(resolved, { style: 'currency', currency, ...formatOptions }).format(value),
    formatPercent: (value, formatOptions) => new Intl.NumberFormat(resolved, { style: 'percent', ...formatOptions }).format(value),
    formatDate: (value, formatOptions) => new Intl.DateTimeFormat(resolved, { timeZone, ...formatOptions }).format(value),
    formatRelativeTime: (value, unit, formatOptions) =>
      new Intl.RelativeTimeFormat(resolved, formatOptions).format(value, unit)
  }
}
