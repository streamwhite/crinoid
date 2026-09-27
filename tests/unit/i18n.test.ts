import { describe, expect, it } from 'vitest'
import {
  createFormatters,
  detectLocale,
  directionForLocale,
  normalizeLocale,
  resolveLocale,
  RTL_LOCALES
} from 'crinoid/i18n'

describe('locale detection', () => {
  it('normalizes locale tags', () => {
    expect(normalizeLocale('en_US')).toBe('en-US')
    expect(normalizeLocale('zh-cn')).toBe('zh-CN')
  })

  it('detects from an explicit preference first', () => {
    expect(detectLocale({ preference: 'fr-FR', system: 'en-US', available: ['en', 'fr-FR'] })).toBe('fr-FR')
  })

  it('falls back to the system locale', () => {
    expect(detectLocale({ system: 'de-DE', available: ['en', 'de'] })).toBe('de')
  })

  it('matches by language subtag', () => {
    expect(detectLocale({ system: 'fr-CA', available: ['en', 'fr'] })).toBe('fr')
  })

  it('falls back to the default locale', () => {
    expect(detectLocale({ system: 'xx-YY', available: ['en', 'fr'], fallback: 'en' })).toBe('en')
  })

  it('defaults to the first available locale when nothing matches', () => {
    expect(detectLocale({ system: 'xx', available: ['fr', 'en'] })).toBe('fr')
  })
})

describe('rtl support', () => {
  it('marks RTL locales', () => {
    expect(RTL_LOCALES).toContain('ar')
    expect(directionForLocale('ar-SA')).toBe('rtl')
    expect(directionForLocale('he')).toBe('rtl')
    expect(directionForLocale('en-US')).toBe('ltr')
    expect(directionForLocale('fa-IR')).toBe('rtl')
  })

  it('resolves locale metadata', () => {
    expect(resolveLocale('ar')).toEqual({ locale: 'ar', direction: 'rtl', isRtl: true })
    expect(resolveLocale('en-US').isRtl).toBe(false)
  })
})

describe('formatters', () => {
  const formatters = createFormatters('en-US', { timeZone: 'UTC' })

  it('formats numbers', () => {
    expect(formatters.formatNumber(1234.5)).toBe('1,234.5')
  })

  it('formats currency', () => {
    expect(formatters.formatCurrency(9.5, 'USD')).toBe('$9.50')
  })

  it('formats percentages', () => {
    expect(formatters.formatPercent(0.25)).toBe('25%')
  })

  it('formats dates in the configured timezone', () => {
    const formatted = formatters.formatDate(new Date('2024-01-01T12:00:00.000Z'), { dateStyle: 'short' })
    expect(formatted).toBe('1/1/24')
  })

  it('exposes the resolved timezone', () => {
    expect(formatters.timeZone).toBe('UTC')
  })

  it('formats relative time', () => {
    expect(formatters.formatRelativeTime(-1, 'day')).toBe('1 day ago')
  })
})
