import { watch, type FSWatcher } from 'node:fs'

export type WatchChangeType = 'change' | 'rename'

export interface WatchEvent {
  readonly type: WatchChangeType
  readonly fileName: string | null
}

export type WatchListener = (event: WatchEvent) => void

export interface Watcher {
  close(): Promise<void>
  isClosed(): boolean
}

export type WatchFactory = (target: string, listener: (eventType: string, fileName: string | null) => void) => FSWatcher

export interface WatchOptions {
  readonly debounceMs?: number
  readonly watch?: WatchFactory | undefined
}

const DEFAULT_DEBOUNCE_MS = 50

export function createNodeWatcher(target: string, listener?: (eventType: string, fileName: string | null) => void): FSWatcher {
  return watch(target, listener ?? (() => {}))
}

export function watchPath(target: string, listener: WatchListener, options: WatchOptions = {}): Watcher {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const factory = options.watch ?? createNodeWatcher
  let timer: ReturnType<typeof setTimeout> | null = null
  let closed = false
  let latest: WatchEvent = { type: 'change', fileName: null }

  const flush = (): void => {
    timer = null
    if (!closed) listener(latest)
  }

  const watcher = factory(target, (eventType, fileName) => {
    latest = { type: eventType as WatchChangeType, fileName }
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, debounceMs)
  })

  return {
    isClosed: () => closed,
    close: () =>
      new Promise<void>((resolve) => {
        closed = true
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        watcher.close()
        resolve()
      })
  }
}
