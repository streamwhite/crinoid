export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiTimeoutError extends Error {
  readonly name: 'TimeoutError'
}

export function createApiError(status: number, message: string): ApiError {
  return new ApiError(status, message)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Request was not authorized'
    if (error.status === 403) return 'Request was forbidden'
    if (error.status === 404) return 'Requested resource was not found'
  }
  return 'The request could not be completed'
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>
}

export interface ApiClientOptions {
  token?: string
  requestId?: () => string
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
  isOnline?: () => boolean
  onRetry?: (attempt: number, error: unknown) => void
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_RETRY_DELAY_MS = 300

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch, options: ApiClientOptions = {}): ApiClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retries = options.retries ?? 0
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS

  const request: ApiClient['request'] = async <T>(path: string, init?: RequestInit) => {
    if (options.isOnline && !options.isOnline()) throw new Error('Network is offline')

    let attempt = 0
    for (;;) {
      try {
        return await attemptRequest<T>(path, init)
      } catch (error) {
        if (attempt >= retries || !isRetryable(error)) throw error
        options.onRetry?.(attempt + 1, error)
        await delay(retryDelayMs * 2 ** attempt)
        attempt += 1
      }
    }
  }

  async function attemptRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const headers = new Headers({ Accept: 'application/json', ...init?.headers })
    if (options.token) headers.set('Authorization', `Bearer ${options.token}`)
    if (options.requestId) headers.set('X-Request-Id', options.requestId())
    try {
      const response = await fetcher(new URL(path, baseUrl), {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers
      })
      if (!response.ok) throw createApiError(response.status, response.statusText)
      return response.json() as Promise<T>
    } catch (error) {
      if (controller.signal.aborted) throw new Error(`Request timed out after ${timeoutMs}ms`)
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  return { request }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) return RETRYABLE_STATUS.has(error.status)
  return !(error instanceof Error && error.name === 'AbortError')
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
