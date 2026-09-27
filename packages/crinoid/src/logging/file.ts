import { appendFile, mkdir, rename, stat, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { LogRecord, LogSink } from '../logging.js'

export interface RotatingFileSinkOptions {
  readonly filePath: string
  readonly maxBytes?: number
  readonly maxFiles?: number
}

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_MAX_FILES = 5
const MIN_MAX_FILES = 2

export function createRotatingFileSink(options: RotatingFileSinkOptions): LogSink {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const maxFiles = Math.max(options.maxFiles ?? DEFAULT_MAX_FILES, MIN_MAX_FILES)
  let queue: Promise<void> = Promise.resolve()

  const enqueue = (task: () => Promise<void>): void => {
    queue = queue.then(task).catch(() => {})
  }

  return {
    write: (record) => {
      enqueue(() => appendRecord(options.filePath, record, maxBytes, maxFiles))
    },
    flush: () => queue
  }
}

async function appendRecord(filePath: string, record: LogRecord, maxBytes: number, maxFiles: number): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await rotateIfNeeded(filePath, maxBytes, maxFiles)
  await appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8')
}

async function rotateIfNeeded(filePath: string, maxBytes: number, maxFiles: number): Promise<void> {
  if ((await fileSize(filePath)) < maxBytes) return
  await unlink(`${filePath}.${maxFiles - 1}`).catch(() => {})
  for (let index = maxFiles - 1; index > 1; index -= 1) {
    await rename(`${filePath}.${index - 1}`, `${filePath}.${index}`).catch(() => {})
  }
  await rename(filePath, `${filePath}.1`).catch(() => {})
}

async function fileSize(filePath: string): Promise<number> {
  try {
    return (await stat(filePath)).size
  } catch {
    return 0
  }
}
