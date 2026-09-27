import { describe, expect, it, vi } from 'vitest'
import { createCrashReporter, scrubContext } from 'crinoid/crash-reporting'

const SECRET_KEYS = ['authorization', 'token', 'password', 'secret']

describe('crash context scrubbing', () => {
  it('redacts secret-looking keys recursively', () => {
    const scrubbed = scrubContext({
      Authorization: 'Bearer abc',
      nested: { password: 'pw', keep: 'ok' },
      list: [{ token: 't' }]
    })

    expect(scrubbed).toMatchObject({
      Authorization: '[redacted]',
      nested: { password: '[redacted]', keep: 'ok' },
      list: [{ token: '[redacted]' }]
    })
  })
})

describe('crash reporter', () => {
  function createOptions() {
    return {
      onCrash: vi.fn(),
      appVersion: '1.2.3',
      platform: 'linux',
      now: () => new Date('2024-01-01T00:00:00.000Z')
    }
  }

  it('builds a report with app metadata', async () => {
    const options = createOptions()
    const reporter = createCrashReporter(options)

    await reporter.report(new Error('boom'), { Authorization: 'secret' })

    expect(options.onCrash).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom',
        appVersion: '1.2.3',
        platform: 'linux',
        time: '2024-01-01T00:00:00.000Z',
        context: { Authorization: '[redacted]' }
      })
    )
  })

  it('captures the stack trace', async () => {
    const options = createOptions()
    const reporter = createCrashReporter(options)

    await reporter.report(new Error('boom'))

    expect(options.onCrash.mock.calls[0]?.[0].stack).toContain('boom')
  })

  it('normalizes non-error values', async () => {
    const options = createOptions()
    const reporter = createCrashReporter(options)

    await reporter.report('plain failure')

    expect(options.onCrash.mock.calls[0]?.[0].message).toBe('plain failure')
  })

  it('swallows sink failures', async () => {
    const options = { ...createOptions(), onCrash: vi.fn(async () => {
      throw new Error('sink down')
    }) }
    const reporter = createCrashReporter(options)

    await expect(reporter.report(new Error('boom'))).resolves.toBeUndefined()
  })

  it('identifies secret keys case-insensitively', () => {
    expect(SECRET_KEYS).toContain('token')
  })
})
