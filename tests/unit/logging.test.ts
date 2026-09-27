import { describe, expect, it, vi } from 'vitest'
import {
  createConsoleSink,
  createLogger,
  createMultiSink,
  levelFromEnvironment,
  type LogRecord
} from 'crinoid/logging'

const FIXED_TIME = '2020-01-01T00:00:00.000Z'

function createCollector() {
  const records: LogRecord[] = []
  return {
    records,
    sink: {
      write: (record: LogRecord) => {
        records.push(record)
      }
    }
  }
}

describe('logger', () => {
  it('filters records below the configured level', () => {
    const { records, sink } = createCollector()
    const logger = createLogger({ level: 'warn', sink, now: () => new Date(FIXED_TIME) })

    logger.debug('hidden')
    logger.info('hidden')
    logger.warn('shown')
    logger.error('shown')

    expect(records.map((record) => record.level)).toEqual(['warn', 'error'])
    expect(records[0]?.time).toBe(FIXED_TIME)
  })

  it('derives a level from the environment name', () => {
    expect(levelFromEnvironment('production')).toBe('info')
    expect(levelFromEnvironment('development')).toBe('debug')
    expect(levelFromEnvironment('test')).toBe('debug')
  })

  it('writes structured JSON through the console sink', () => {
    const target = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }

    createConsoleSink(target).write({ level: 'info', message: 'hello', time: FIXED_TIME })

    expect(target.info).toHaveBeenCalledWith(JSON.stringify({ level: 'info', message: 'hello', time: FIXED_TIME }))
  })

  it('fans a record out to every sink and flushes them all', async () => {
    const first = createCollector()
    const second = createCollector()
    const flush = vi.fn()
    const sink = createMultiSink([first.sink, second.sink, { write: () => {}, flush }])

    sink.write({ level: 'info', message: 'hello', time: FIXED_TIME })
    await sink.flush?.()

    expect(first.records).toHaveLength(1)
    expect(second.records[0]?.message).toBe('hello')
    expect(flush).toHaveBeenCalledTimes(1)
  })
})
