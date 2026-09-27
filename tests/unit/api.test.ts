import { describe, expect, it, vi } from 'vitest'
import { createApiClient, createApiError, getErrorMessage } from 'crinoid/api'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('api client', () => {
  it('returns parsed json on success', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient('https://api.example', fetcher)

    await expect(client.request('/thing')).resolves.toEqual({ ok: true })
  })

  it('retries retryable status codes with backoff', async () => {
    vi.useFakeTimers()
    try {
      let calls = 0
      const fetcher = vi.fn(async () => {
        calls += 1
        return calls < 3 ? jsonResponse({}, 503) : jsonResponse({ ok: true })
      })
      const client = createApiClient('https://api.example', fetcher, { retries: 3, retryDelayMs: 10 })

      const promise = client.request('/thing')
      await vi.runAllTimersAsync()

      await expect(promise).resolves.toEqual({ ok: true })
      expect(fetcher).toHaveBeenCalledTimes(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not retry non-retryable status codes', async () => {
    const fetcher = vi.fn(async () => jsonResponse({}, 400))
    const client = createApiClient('https://api.example', fetcher, { retries: 3 })

    await expect(client.request('/thing')).rejects.toMatchObject({ status: 400 })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('aborts after the timeout', async () => {
    vi.useFakeTimers()
    try {
      const fetcher = vi.fn((_url: URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      }))
      const client = createApiClient('https://api.example', fetcher as unknown as typeof fetch, { timeoutMs: 50, retries: 0 })

      const promise = client.request('/slow')
      const assertion = expect(promise).rejects.toThrow('timed out')
      await vi.advanceTimersByTimeAsync(60)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports offline and skips the request', async () => {
    const fetcher = vi.fn()
    const client = createApiClient('https://api.example', fetcher as unknown as typeof fetch, { isOnline: () => false })

    await expect(client.request('/thing')).rejects.toThrow('offline')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('attaches auth and request id headers', async () => {
    const fetcher = vi.fn(async (_url: URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('Bearer token')
      expect(headers.get('X-Request-Id')).toBe('req-1')
      return jsonResponse({})
    })
    const client = createApiClient('https://api.example', fetcher as unknown as typeof fetch, {
      token: 'token',
      requestId: () => 'req-1'
    })

    await client.request('/thing')
    expect(fetcher).toHaveBeenCalled()
  })
})

describe('api errors', () => {
  it('normalizes status-specific messages', () => {
    expect(getErrorMessage(createApiError(401, 'Unauthorized'))).toBe('Request was not authorized')
    expect(getErrorMessage(createApiError(500, 'Server'))).toBe('The request could not be completed')
  })
})
