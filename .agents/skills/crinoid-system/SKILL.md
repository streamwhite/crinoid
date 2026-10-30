---
name: crinoid-system
description: Integrate OS services, security policy, and observability in a crinoid desktop app. Use when adding clipboard, native notifications, shell open/reveal/trash, system or battery info, connectivity status, OS-keychain secrets, CSP and URL/permission/IPC sender policies, structured logging, metrics, tracing, crash reporting, or user feedback. Triggers on clipboard, Notification, shell.openExternal, safeStorage, buildContentSecurityPolicy, createLogger, createMetrics, createTracer, createCrashReporter, createObservability, feedback.
---

# Crinoid system, security, and observability

## OS capabilities

```ts
import { createClipboardService } from 'crinoid/clipboard'
import { createNotificationService } from 'crinoid/notifications'
import { createShellService } from 'crinoid/shell'
import { collectSystemInfo } from 'crinoid/system'
import { readBatteryStatus, createPowerMonitor } from 'crinoid/power'
import { readNetworkStatus, createNetworkMonitor } from 'crinoid/network'
import { createSecretStore } from 'crinoid/secrets'

const clipboard = createClipboardService(port)
const notifications = createNotificationService(port)
const shell = createShellService(shellPort)
const info = collectSystemInfo(port)
const battery = await readBatteryStatus(port)
const online = await readNetworkStatus(port)
const secrets = createSecretStore(port)
```

- Clipboard supports text, HTML, and PNG images (`readImage`/`writeImage` as `Uint8Array`).
- Notifications support click/close handlers and support detection.
- Shell allows only allowlisted URLs, plus `openPath`, `showItemInFolder`, and `trashItem`.
- System info covers OS/platform/arch/release/hostname, CPU model and cores, memory, uptime, and app facts.
- Power monitor forwards suspend/resume/lock/unlock; battery status reports charging state.
- Network status comes from Electron `net.isOnline()` in the main process; the renderer also gets
  `online`/`offline` events.
- Secrets use the OS keychain through `safeStorage`; `createSecretStore` throws when encryption is unavailable.

Renderer surface: `desktop.clipboard`, `desktop.notifications.show`, `desktop.shell`, `desktop.system.info`,
`desktop.power`, `desktop.network`, and `desktop.secrets`.

## Security policy

`crinoid/security` and `createMainProcess` enforce:

- Every window uses `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`.
- The preload exposes only the fixed `window.desktop` capability surface; there is no generic invoke.
- `buildContentSecurityPolicy` defaults to `default-src 'self'`, `object-src 'none'`, and no `unsafe-eval`.
  `installContentSecurityPolicy` applies it to a session.
- `isAllowedExternalUrl` permits only `https:` and `mailto:`.
- `isPermissionAllowed` allows only approved permissions (notifications).
- `isTrustedSender` and `createIpcRegistry` reject untrusted senders before handlers run.
- `createSecretStore` encrypts values through the OS keychain and never falls back to plaintext.

Rules:

- Do not weaken CSP, sandbox, context isolation, or the URL allowlist.
- Do not add a generic IPC channel or expose `ipcRenderer`.
- Never log tokens, passwords, or secret values; crash reporting scrubs secret-looking context keys but is
  not a substitute for care.
- Use `crinoid/secrets` for credentials; use preferences for non-sensitive settings.

## Logging, metrics, tracing, crashes, feedback

```ts
import { createLogger, createRotatingFileSink, levelFromEnvironment } from 'crinoid/logging'
import { createMetrics } from 'crinoid/metrics'
import { createTracer } from 'crinoid/trace'
import { createCrashReporter } from 'crinoid/crash-reporting'
import { buildFeedbackReport } from 'crinoid/feedback'
import { createObservability } from 'crinoid/observability'

const logger = createLogger({
  level: levelFromEnvironment(environment.name),
  sink: createRotatingFileSink({ filePath: join(app.getPath('logs'), 'app.log') })
})

const metrics = createMetrics()
const tracer = createTracer()
const crashes = createCrashReporter({
  appVersion: app.getVersion(),
  platform: process.platform,
  onCrash: reportCrash
})

const observability = createObservability({
  appVersion: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  logFile: join(app.getPath('logs'), 'app.log')
})
```

- `createLogger` emits structured JSON records with level filtering; use `createMultiSink` to fan out.
- `createRotatingFileSink` rotates by size and keeps `maxFiles` backups.
- `createMetrics` records counters and timing samples (`count`/`min`/`max`/`avg`/`p50`/`p95`).
- `createTracer` provides `wrapIpc` and `wrapTask`; `createIpcRegistry` emits `ipc:<channel>` spans and
  records `ipc.duration` / `ipc.calls` when a tracer/metrics are supplied.
- `createCrashReporter` normalizes thrown values, attaches app metadata, scrubs secret-looking context, and
  never throws from its sink.
- `buildFeedbackReport` validates and stamps user feedback; renderer submits through `desktop.feedback.submit`.
- `createObservability` composes logger, metrics, tracer, crash reporter, and feedback sink.
- `createMainProcess({ observability })` wires observability by default and accepts overrides.

Renderer error boundary errors can be forwarded with
`desktop.crash.report({ message, stack, context })`.

## Rules

- Log identifiers and counts, not payloads that may contain personal or secret data.
- Use metrics with bounded label sets; do not create unbounded metric names per user action.
- Let crash reporting own exception serialization; do not build ad-hoc error payloads.
- Install global error handlers through `createMainProcess` or `installGlobalErrorHandlers`, not duplicate
  `process.on` listeners.

## Authoritative references

`node_modules/crinoid/API.md` (system capabilities, security, errors and observability) and
`node_modules/crinoid/README.md`.
