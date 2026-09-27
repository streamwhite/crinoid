export type SocketStatus = 'closed' | 'connecting' | 'open' | 'closing'

export interface SocketLike {
  readyState: number
  send(data: string): void
  close(): void
  addEventListener(event: string, listener: (event: unknown) => void): void
  removeEventListener(event: string, listener: (event: unknown) => void): void
}

export interface WebSocketClientOptions {
  readonly createSocket?: (url: string) => SocketLike
  readonly isAllowedUrl?: (url: string) => boolean
  readonly reconnectDelayMs?: number
  readonly maxReconnectDelayMs?: number
  readonly onMessage?: (data: string) => void
  readonly onOpen?: () => void
  readonly onClose?: () => void
  readonly onError?: (error: unknown) => void
  readonly onReconnect?: (attempt: number) => void
}

export interface WebSocketClient {
  connect(): void
  send(data: string): void
  status(): SocketStatus
  dispose(): void
}

const DEFAULT_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000

export function createWebSocketClient(url: string, options: WebSocketClientOptions = {}): WebSocketClient {
  const createSocket = options.createSocket ?? ((target) => new WebSocket(target) as unknown as SocketLike)
  const isAllowed = options.isAllowedUrl ?? (() => true)
  const baseDelay = options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS
  const maxDelay = options.maxReconnectDelayMs ?? MAX_RECONNECT_DELAY_MS
  let socket: SocketLike | null = null
  let status: SocketStatus = 'closed'
  let disposed = false
  let attempt = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  const queue: string[] = []

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
    if (!isAllowed(url)) throw new Error(`WebSocket URL is not allowed: ${url}`)
    status = 'connecting'
    socket = createSocket(url)
    socket.addEventListener('open', () => {
      status = 'open'
      attempt = 0
      options.onOpen?.()
      for (const message of queue.splice(0)) socket?.send(message)
    })
    socket.addEventListener('message', (event) => {
      const data = (event as { data?: unknown }).data
      if (typeof data === 'string') options.onMessage?.(data)
    })
    socket.addEventListener('error', (error) => options.onError?.(error))
    socket.addEventListener('close', () => {
      status = 'closed'
      options.onClose?.()
      scheduleReconnect()
    })
  }

  return {
    connect,
    send: (data) => {
      if (socket && status === 'open') socket.send(data)
      else queue.push(data)
    },
    status: () => status,
    dispose: () => {
      disposed = true
      if (timer) clearTimeout(timer)
      timer = null
      status = 'closing'
      socket?.close()
      status = 'closed'
    }
  }
}
