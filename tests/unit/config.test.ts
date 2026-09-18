import { describe, expect, it } from 'vitest'
import { readConfig } from '../../src/config/env'

describe('application configuration', () => {
  it('uses safe defaults when optional environment values are absent', () => {
    expect(readConfig({})).toEqual({ defaultLocale: 'en', apiBaseUrl: null })
  })

  it('rejects an API URL that is not HTTPS', () => {
    expect(() => readConfig({ VITE_API_BASE_URL: 'http://api.example.com' })).toThrow('HTTPS')
  })
})
