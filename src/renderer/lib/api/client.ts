import { createApiError } from './errors'

export interface ApiClient { request<T>(path: string, init?: RequestInit): Promise<T> }
export interface ApiClientOptions { token?: string; requestId?: () => string; timeoutMs?: number }

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch, options: ApiClientOptions = {}): ApiClient {
  const timeoutMs = options.timeoutMs ?? 15_000
  return { request: async <T>(path: string, init?: RequestInit) => { const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs); const headers = new Headers({ Accept: 'application/json', ...init?.headers }); if (options.token) headers.set('Authorization', `Bearer ${options.token}`); if (options.requestId) headers.set('X-Request-Id', options.requestId()); try { const response = await fetcher(new URL(path, baseUrl), { ...init, signal: init?.signal ?? controller.signal, headers }); if (!response.ok) throw createApiError(response.status, response.statusText); return response.json() as Promise<T> } finally { clearTimeout(timeout) } } }
}
