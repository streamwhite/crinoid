import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { Logger } from 'crinoid/logging'
import { createObservability } from 'crinoid/observability'

const BASE = { appVersion: '1.2.3', platform: 'linux', arch: 'x64' }

function silentLogger(): Logger {
  return { debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, flush: async () => {} }
}

describe('observability composition', () => {
  it('builds crash reports with app metadata and context', async () => {
    const onCrash = vi.fn()
    const observability = createObservability({ ...BASE, logger: silentLogger(), onCrash })

    await observability.reportCrash(new Error('boom'), { scope: 'uncaughtException' })

    expect(onCrash).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'boom',
        appVersion: '1.2.3',
        platform: 'linux',
        context: { scope: 'uncaughtException' }
      })
    )
  })

  it('submits feedback with app metadata to the configured sink', async () => {
    const onFeedback = vi.fn()
    const observability = createObservability({ ...BASE, logger: silentLogger(), onFeedback })

    const report = await observability.submitFeedback({ message: 'please add dark mode', category: 'feature' })

    expect(report).toMatchObject({ message: 'please add dark mode', arch: 'x64', category: 'feature' })
    expect(onFeedback).toHaveBeenCalledWith(expect.objectContaining({ message: 'please add dark mode' }))
  })

  it('records trace spans as metrics', async () => {
    const observability = createObservability({ ...BASE, logger: silentLogger() })

    await observability.tracer.trace('ipc:ping', async () => 'pong')
    await expect(observability.tracer.trace('task:fail', async () => { throw new Error('nope') })).rejects.toThrow('nope')

    expect(observability.metrics.summary('trace.duration').count).toBe(2)
    expect(observability.metrics.counter('trace.errors')).toBe(1)
  })

  it('writes structured logs to a rotating file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'observability-'))
    try {
      const observability = createObservability({ ...BASE, logFile: join(directory, 'app.log') })

      observability.logger.info('hello', { area: 'test' })
      await observability.logger.flush()

      const line = (await readFile(join(directory, 'app.log'), 'utf8')).trim()
      expect(JSON.parse(line)).toMatchObject({ level: 'info', message: 'hello', context: { area: 'test' } })
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
