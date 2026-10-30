---
name: crinoid-services
description: Add networking, authentication, background work, and updates to a crinoid desktop app. Use when implementing HTTP API clients, WebSocket or SSE streams, downloads/uploads, proxy settings, login/session/token/OAuth, deep-link callbacks, job queues, cron schedules, worker pools, task progress/cancellation/retry, or auto-update and release channels. Triggers on createApiClient, createWebSocketClient, createSseClient, createSessionManager, createTokenManager, createOAuthClient, createJobQueue, createScheduler, createWorkerPool, createUpdateService.
---

# Crinoid services

This skill covers the long-running and remote side of an app: networking, auth, background tasks, and
updates. Keep renderer code on the `window.desktop` bridge where a bridge exists; use the package APIs
directly in the main process.

## HTTP, WebSocket, SSE

```ts
import { createApiClient } from 'crinoid/api'
import { createWebSocketClient } from 'crinoid/websocket'
import { createSseClient } from 'crinoid/sse'

const api = createApiClient('https://api.example.com', fetch, {
  token,
  timeoutMs: 15_000,
  retries: 3,
  isOnline: () => navigator.onLine,
  onRetry: (attempt, error) => console.warn('retry', attempt, error)
})

const socket = createWebSocketClient('wss://api.example.com/socket', {
  onMessage: (data) => console.log(data)
})
socket.connect()

const events = createSseClient('https://api.example.com/events', {
  onEvent: (name, data) => console.log(name, data)
})
events.connect()
```

- `createApiClient` adds auth and request-id headers, retries 408/425/429/5xx with exponential backoff,
  enforces a timeout, and short-circuits while offline.
- `createWebSocketClient` uses an allowlist, queues messages until open, and reconnects with backoff.
- `createSseClient` wraps `EventSource` with reconnect and status tracking.
- Do not put tokens in renderer storage; use `desktop.secrets` or the auth bridge.

## Downloads, uploads, proxy

```ts
import { createTransferManager } from 'crinoid/transfers'
import { applyProxy } from 'crinoid/proxy'

const transfers = createTransferManager({
  session: session.defaultSession,
  onProgress: (progress) => console.log(progress),
  onError: (error) => console.error(error)
})

transfers.download('https://example.com/file.bin', { savePath: '/tmp/file.bin' })
const upload = transfers.createUpload('https://api.example.com/upload', 'report.pdf')
upload.start()
upload.progress(10, 100)
upload.complete()

await applyProxy(session.defaultSession, { mode: 'fixed', url: 'http://proxy:8080' })
```

`createMainProcess({ proxy })` applies proxy configuration and wires a download manager for the renderer.
Renderer surface: `desktop.transfers.download`, `cancelAll`, and strongly typed `onProgress`.

## Authentication

```ts
import { createSessionManager, createTokenManager, createOAuthClient } from 'crinoid/auth'

const session = createSessionManager<{ id: string }>({
  storage: sessionStorage,
  authenticate: async (credentials) => loginRequest(credentials) // AuthResult<User> | null
})

const tokens = createTokenManager({ provider: { refresh: refreshRequest } })
tokens.set({ accessToken, refreshToken, expiresAt })

const oauth = createOAuthClient({
  clientId,
  authorizeUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  redirectUri: 'myapp://auth/callback',
  exchange: async ({ code, codeVerifier, redirectUri }) => exchangeCode(code, codeVerifier, redirectUri)
})
```

- `createSessionManager` logs in/out, persists the session, and restores it on startup.
- `createTokenManager` tracks expiry with a safety skew and refreshes through a provider.
- `createOAuthClient` implements PKCE (`createPkcePair`), validates `state`, and exchanges the callback code.
- `createMainProcess({ auth })` registers auth IPC and restores the session automatically.
- Renderer surface: `desktop.auth.login/logout/session/tokens/onChanged`.
- Deep-link callbacks: `parseDeepLink`, `parseDeepLinkPath`, and `createDeepLinkRouter` from
  `crinoid/deep-link`; `parseOAuthCallback` extracts `code` and `state` from a callback URL.

Never log tokens, passwords, or full session objects. Use `crinoid/secrets` for long-lived credentials.

## Background tasks

```ts
import { createJobQueue, createScheduler, createTaskContext, createWorkerPool, nextCronRun } from 'crinoid/tasks'

const task = createTaskContext({
  name: 'import',
  tracer,
  onProgress: (progress) => console.log(progress)
})
await task.run(async (signal) => importFile(signal), { retries: 2 })

const queue = createJobQueue({ concurrency: 4 })
await queue.add((signal) => longRunning(signal), {
  retries: 3,
  onStart: () => console.log('started')
})

const scheduler = createScheduler()
scheduler.schedule('cleanup', { cron: '0 3 * * *' }, () => cleanup())

const pool = createWorkerPool<IoInput, IoOutput>({
  size: 4,
  createWorker: (index) => createIoWorker(index)
})
```

Use `TaskContext` for status, progress, cancellation, and retry. Queues respect `concurrency`; schedulers
support intervals and cron specs (`nextCronRun`); worker pools reuse workers across tasks.

## Updates and release channels

```ts
import { createUpdateService, resolveChannel } from 'crinoid/tasks'

const updates = createUpdateService({
  adapter: electronUpdaterAdapter,
  currentVersion: app.getVersion(),
  channel: resolveChannel('beta'),
  onRollback: (version) => console.warn('rolled back to', version)
})

await updates.check()
await updates.download((progress) => console.log(progress))
updates.setChannel('stable')
updates.install()
```

- `createMainProcess({ updaterAdapter | updater, releaseChannel, onRollback })` wires the service.
- Renderer surface: `desktop.updates.check/download/install/rollback/setChannel/onProgress`.
- `DEFAULT_CHANNELS` contains `stable` and `beta`; `resolveChannel` falls back to stable.
- Linux updates are delegated to the package manager by design.

## Rules

- Keep tokens and session data out of renderer logs and renderer persistence.
- Use `isOnline` on the API client instead of polling connectivity in every feature.
- Long-running work goes through the task/queue layer so progress, cancellation, and retries stay consistent.
- Do not call update APIs before the app is ready or while another install is in progress.
- Apply proxy configuration once on the default session; do not create ad-hoc sessions per feature.

## Authoritative references

`node_modules/crinoid/API.md` (networking, authentication, task system, updates) and
`node_modules/crinoid/README.md`.
