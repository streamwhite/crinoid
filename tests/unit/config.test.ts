import { describe, expect, it } from 'vitest'
import { DEFAULT_FEATURES, createDesktopConfig } from 'crinoid/config'

describe('desktop config', () => {
  it('applies defaults', () => {
    const config = createDesktopConfig({ appName: 'App' })

    expect(config.defaultLocale).toBe('en')
    expect(config.apiBaseUrl).toBeNull()
    expect(config.protocol).toBe('myapp')
    expect(config.features).toEqual(DEFAULT_FEATURES)
  })

  it('trims the locale and falls back to en when blank', () => {
    expect(createDesktopConfig({ appName: 'App', defaultLocale: '  zh-CN  ' }).defaultLocale).toBe('zh-CN')
    expect(createDesktopConfig({ appName: 'App', defaultLocale: '   ' }).defaultLocale).toBe('en')
  })

  it('merges feature flags over the defaults', () => {
    const config = createDesktopConfig({ appName: 'App', features: { tray: true } })

    expect(config.features).toEqual({ ...DEFAULT_FEATURES, tray: true })
  })

  it('accepts an https api base url and treats blank values as absent', () => {
    expect(createDesktopConfig({ appName: 'App', apiBaseUrl: 'https://api.example.com' }).apiBaseUrl).toBe(
      'https://api.example.com'
    )
    expect(createDesktopConfig({ appName: 'App', apiBaseUrl: '   ' }).apiBaseUrl).toBeNull()
    expect(createDesktopConfig({ appName: 'App', apiBaseUrl: null }).apiBaseUrl).toBeNull()
    expect(createDesktopConfig({ appName: 'App' }).apiBaseUrl).toBeNull()
  })

  it('rejects insecure or malformed api base urls', () => {
    expect(() => createDesktopConfig({ appName: 'App', apiBaseUrl: 'http://insecure.example' })).toThrow('HTTPS')
    expect(() => createDesktopConfig({ appName: 'App', apiBaseUrl: 'not a url' })).toThrow()
  })

  it('uses a custom protocol when provided', () => {
    expect(createDesktopConfig({ appName: 'App', protocol: 'acme' }).protocol).toBe('acme')
  })
})
