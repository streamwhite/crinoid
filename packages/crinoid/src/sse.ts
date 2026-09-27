export type SseStatus = 'closed' | 'connecting' | 'open'

export interface EventSourceLike {
  addEventListener(event: string, listener: (event: unknown) => void): void
  removeEventListener(event: string, listener: (event: unknown) => void): void
  close(): void
}

export interface SseClientOptions {
  readonly createEventSource?: (url: string) => EventSourceLike
  readonly isAllowedUrl?: (url: string) => boolean
  readonly reconnectDelayMs?: number
  readonly maxReconnectDelayMs?: number
  readonly onEvent?: (event: string, data: string) => void
  readonly onOpen?: () => void
  readonly onError?: (error: unknown) => void
  readonly onReconnect?: (attempt: number) => void
}

export interface SseClient {
  connect(): void
  status(): SseStatus
  dispose(): void
}

const DEFAULT_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000

export function createSseClient(url: string, options: SseClientOptions = {}): SseClient {
  const createEventSource = options.createEventSource ?? ((target) => new EventSource(target) as unknown as EventSourceLike)
  const isAllowed = options.isAllowedUrl ?? (() => true)
  const baseDelay = options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS
  const maxDelay = options.maxReconnectDelayMs ?? MAX_RECONNECT_DELAY_MS
  let source: EventSourceLike | null = null
  let status: SseStatus = 'closed'
  let disposed = false
  let attempt = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const scheduleReconnect = (): void => {
    if (disposed || timer) return
    const delay = Math.min(baseDelay * 2 ** attempt, maxDelay)
    attempt += 1
    timer = setTimeout(() => {
      timer = null
      options.onReconnect?.(attempt)
      connect()
    }, delay)
  }

  function connect(): void {
    if (disposed) return
    if (!isAllowed(url)) throw new Error(`SSE URL is not allowed: ${url}`)
    status = 'connecting'
    source = createEventSource(url)
    source.addEventListener('open', () => {
      status = 'open'
      attempt = 0
      options.onOpen?.()
    })
    source.addEventListener('message', (event) => {
      const data = (event as { data?: unknown }).data
      if (typeof data === 'string') options.onEvent?.('message', data)
    })
    source.addEventListener('error', (error) => {
      if (disposed) return
      options.onError?.(error)
      source?.close()
      scheduleReconnect()
    })
  }

  return {
    connect,
    status: () => status,
    dispose: () => {
      disposed = true
      if (timer) clearTimeout(timer)
      timer = null
      source?.close()
      status = 'closed'
    }
  }
}
