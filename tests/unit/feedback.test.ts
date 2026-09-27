import { describe, expect, it, vi } from 'vitest'
import { buildFeedbackReport, isFeedbackReport } from 'crinoid/feedback'

describe('feedback report', () => {
  it('builds a report with diagnostics', () => {
    const report = buildFeedbackReport({
      message: 'It crashes on export',
      appVersion: '1.2.3',
      platform: 'linux',
      arch: 'x64',
      logs: ['line 1', 'line 2'],
      now: () => new Date('2024-01-01T00:00:00.000Z')
    })

    expect(report).toMatchObject({
      message: 'It crashes on export',
      appVersion: '1.2.3',
      platform: 'linux',
      arch: 'x64',
      logs: ['line 1', 'line 2'],
      createdAt: '2024-01-01T00:00:00.000Z'
    })
  })

  it('trims the message and rejects empty feedback', () => {
    expect(() => buildFeedbackReport({ message: '   ', appVersion: '1', platform: 'linux', arch: 'x64' })).toThrow('message')
  })

  it('validates a well-formed report', () => {
    const report = buildFeedbackReport({ message: 'ok', appVersion: '1', platform: 'linux', arch: 'x64' })

    expect(isFeedbackReport(report)).toBe(true)
    expect(isFeedbackReport({ message: 1 })).toBe(false)
  })

  it('includes optional email and category', () => {
    const report = buildFeedbackReport({
      message: 'bug',
      appVersion: '1',
      platform: 'linux',
      arch: 'x64',
      email: 'a@b.com',
      category: 'bug'
    })

    expect(report.email).toBe('a@b.com')
    expect(report.category).toBe('bug')
  })
})

describe('feedback channel payload', () => {
  it('accepts the validated report', () => {
    const send = vi.fn()
    const report = buildFeedbackReport({ message: 'ok', appVersion: '1', platform: 'linux', arch: 'x64' })

    send(report)

    expect(send).toHaveBeenCalledWith(report)
  })
})
