import { describe, expect, it } from 'vitest'
import { environmentFromProcess, resolveEnvironment } from 'crinoid/environment'

describe('environment resolution', () => {
  it('defaults to development when the application is not packaged', () => {
    expect(resolveEnvironment({}).name).toBe('development')
  })

  it('defaults to production when the application is packaged', () => {
    expect(resolveEnvironment({ isPackaged: true }).name).toBe('production')
  })

  it('honors an explicit NODE_ENV value', () => {
    const info = resolveEnvironment({ nodeEnv: 'test', isPackaged: true })
    expect(info.isTest).toBe(true)
    expect(info.isProduction).toBe(false)
  })

  it('ignores unknown NODE_ENV values', () => {
    expect(resolveEnvironment({ nodeEnv: 'staging', isPackaged: true }).name).toBe('production')
  })

  it('reads from a process-like environment record', () => {
    expect(environmentFromProcess({ NODE_ENV: 'production' }, false).isProduction).toBe(true)
  })
})
