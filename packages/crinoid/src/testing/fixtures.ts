import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export interface Deferred<T> {
  readonly promise: Promise<T>
  resolve(value: T): void
  reject(reason?: unknown): void
}

export function createDeferred<T>(): Deferred<T> {
  let resolveFn: (value: T) => void = () => {}
  let rejectFn: (reason?: unknown) => void = () => {}
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve
    rejectFn = reject
  })
  return { promise, resolve: resolveFn, reject: rejectFn }
}

export interface WaitForOptions {
  readonly timeoutMs?: number
  readonly intervalMs?: number
}

const DEFAULT_TIMEOUT_MS = 2000
const DEFAULT_INTERVAL_MS = 10

export async function waitFor(condition: () => boolean | Promise<boolean>, options: WaitForOptions = {}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS
  const deadline = Date.now() + timeoutMs
  while (!(await condition())) {
    if (Date.now() >= deadline) throw new Error(`waitFor timed out after ${timeoutMs}ms`)
    await delay(intervalMs)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DEFAULT_TEMP_PREFIX = 'desktop-test-'

export function createTempDir(prefix: string = DEFAULT_TEMP_PREFIX): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

export async function withTempDir<T>(run: (directory: string) => Promise<T>, prefix: string = DEFAULT_TEMP_PREFIX): Promise<T> {
  const directory = await createTempDir(prefix)
  try {
    return await run(directory)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
