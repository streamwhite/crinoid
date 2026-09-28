---
name: framework-development
description: Build secure Electron + React + Vite + TypeScript desktop apps with the crinoid framework. Use when creating a new desktop project or wiring any infrastructure in one - main process, preload bridge, typed IPC, windows, tray/menus, state, file system, networking, auth, SQLite, background tasks, auto-update, security, logging/observability, i18n, testing, or Forge packaging. Triggers on crinoid, create-crinoid, Electron desktop app, window.desktop, createMainProcess.
---

# Crinoid desktop framework

Crinoid is an opinionated Electron + React + Vite + TypeScript desktop framework shipped as the `crinoid`
package. A project depends on it and writes **business features only**; all reusable desktop infrastructure
comes from the package. The package never edits consumer source files.

Two things to get right:

1. **Use the package, never copy it.** Add `crinoid`, import from its subpaths, and update with
   `pnpm update crinoid`.
2. **Respect the process boundary.** Renderer talks only to `window.desktop`; only main touches Electron/Node.

## Install / scaffold

```bash
# new project (writes a thin scaffold that depends on the package)
pnpm dlx create-crinoid my-app
cd my-app && pnpm install && pnpm dev

# existing project
pnpm add crinoid
pnpm add react react-dom electron        # peer dependencies
```

The published entry points are `crinoid`, `crinoid/main`, `crinoid/preload`, `crinoid/react`, and one
subpath per capability (see the feature map below).

## Golden rules

- Renderer **must not** import `electron` or `node:*`. Reach the OS through `window.desktop`.
- Preload stays thin: `exposeDesktopApi()` and nothing else. Never expose raw `ipcRenderer`/`require`.
- Every IPC channel is an explicit capability (`dialog.open-file`), never a generic `invoke("run-anything")`.
- Never hard-code user-facing strings; use `react-intl` through `DesktopProviders`.
- Keep server state (API/query) separate from client UI state.
- Add business code under `src/features/<feature>/`; leave infrastructure outside features.

## Quick start (three entry files)

```ts
// src/main/index.ts
import { join } from 'node:path'
import { createDesktopConfig } from 'crinoid/config'
import { createMainProcess } from 'crinoid/main'

const config = createDesktopConfig({ appName: 'My App' })

createMainProcess({
  config,
  window: {
    preloadPath: join(__dirname, 'preload.js'),
    rendererFile: join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL
  }
})
```

```ts
// src/preload/index.ts
import { exposeDesktopApi } from 'crinoid/preload'
exposeDesktopApi()
```

```tsx
// src/renderer/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell, DesktopProviders, ErrorBoundary } from 'crinoid/react'
import messages from './locales/en/common.json'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={(error) => <p role="alert">{error.message}</p>}>
      <DesktopProviders locale="en" messages={messages}>
        <AppShell />
      </DesktopProviders>
    </ErrorBoundary>
  </StrictMode>
)
```

```ts
// src/renderer/vite-env.d.ts  - typed bridge
import type { DesktopAPI } from 'crinoid/ipc'
declare global {
  interface Window {
    desktop: DesktopAPI
  }
}
export {}
```

Build config is three files plus Forge. `create-crinoid` (and `examples/reference-app` in the repo) is the
canonical copy-paste source:

- `forge.config.ts` uses `createForgeConfig` from `crinoid/forge` + `VitePlugin` + `FusesPlugin`.
- `vite.config.mts` uses `createRendererViteConfig`; `vite.main.config.mts` uses `createMainViteConfig`;
  `vite.preload.config.mts` uses `createPreloadViteConfig` (all from `crinoid/vite`).

## Projects created with create-crinoid

```
src/main/index.ts       start the main process from the package
src/preload/index.ts    expose the typed desktop bridge
src/renderer/           React UI (AppShell, locales/, features/)
src/features/<name>/    business features: components/ hooks/ api/ schemas/ types/
forge.config.ts  vite*.config.mts  tsconfig.json
```

## `createMainProcess` options

All optional except `config` and `window`; everything is also exported for manual composition.

| Option | Wires |
| --- | --- |
| `config`, `window`, `windows[]`, `childWindows{}` | main window, extra top-level windows, named child windows (`desktop.window.open(id)`) |
| `menuTemplate`, `tray`, `shortcuts` | native menu, tray (minimize/close to tray), global accelerators |
| `state`, `recentFiles` | cross-window synced store + recent-files list (`desktop.store`, `desktop.preferences`, `desktop.recentFiles`) |
| `auth` | auth IPC + session restore (`desktop.auth`) |
| `proxy` | system/direct/fixed/pac proxy |
| `updaterAdapter` / `updater`, `releaseChannel`, `onRollback` | auto-update (`desktop.updates`) |
| `observability` | logger, metrics, tracer, crash reporter, feedback |
| `autoLaunch` | login-at-startup |
| `environment`, `deps` | override environment detection / inject main deps for tests |
| `onShutdown`, `onError` | graceful cleanup, global error hook |

By default it installs the environment, lifecycle, graceful shutdown, global error handling, structured
logging, typed IPC with sender validation, the restrictive CSP, and the window registry.

## Feature map (import path -> what it exports)

`createMainProcess` already wires most of this; import the modules directly when you need finer control.

### Foundation

| Import | Exports |
| --- | --- |
| `crinoid/config` | `createDesktopConfig`, `DEFAULT_FEATURES` (feature flags: tray/autoUpdate/deepLink/commandPalette) |
| `crinoid/environment` | `resolveEnvironment`, `environmentFromProcess`, `readEnvValue` |
| `crinoid/lifecycle` | `createAppLifecycle`, `createShutdownManager`, `withTimeout` |
| `crinoid/errors` | `installGlobalErrorHandlers`, `normalizeError` |
| `crinoid/logging` | `createLogger`, `createConsoleSink`, `createMultiSink`, `createRotatingFileSink`, `levelFromEnvironment` |
| `crinoid/ipc` | `createChannel`, `createIpcRegistry`, `createIpcInvoker`, `IPC_CHANNELS`, `DESKTOP_CHANNELS`, `DesktopAPI` |
| `crinoid/window` | `createWindowRegistry`, `ensureVisibleOnDisplays`, `loadWindowState`, `saveWindowState`, `DEFAULT_WINDOW_STATE` |
| `crinoid/main` | `createMainProcess`, `createDesktopWindow`, `createChildWindow`, `acquireSingleInstance` |

Typed IPC - define the channel once; the registry rejects untrusted senders and invalid payloads:

```ts
import { createChannel, createIpcRegistry } from 'crinoid/ipc'

const increment = createChannel<{ by: number }, number>(
  'counter.increment',
  (v): v is { by: number } => typeof (v as { by?: unknown })?.by === 'number'
)
const registry = createIpcRegistry(ipcMain, { origin: 'file:', logger })
const dispose = registry.register({ channel: increment, handle: ({ request }) => count += request.by })
```

### Windows and interface (`crinoid/tray`, `crinoid/menu`, `crinoid/context-menu`, `crinoid/shortcuts`, `crinoid/dialogs`, `crinoid/integration`)

Dialogs (open/save/directory/confirm), tray controller (click-to-show, minimize/close to tray), role-based
menus + native context menus, global shortcut manager, custom title bar via `window.chrome`, fullscreen /
always-on-top, and Dock/Taskbar badges, attention, progress, and flashing via `createPlatformIntegration`.

### Application state (`crinoid/reactive`, `crinoid/persistent`, `crinoid/state-sync`, `crinoid/preferences`, `crinoid/recent-items`)

`createStore` (typed get/set/update/subscribe + derived `select`), `createPersistentStore` (loads from a
`Storage`, merges defaults, writes on change), `createStateSync` (broadcast to every window),
`createPreferences` (per-key get/set/reset + change events), `createRecentItems` (ordered, de-duplicated, capped).

### File system (`crinoid/fs`, `crinoid/stream`, `crinoid/watch`, `crinoid/paths`, `crinoid/mime`)

Read/write text and JSON, list/copy/move/remove/exists/ensureDir, streaming read/write with byte progress,
debounced `watchPath`, path helpers (`joinPath`, `isSubPath`, `uniquePath`, ...), MIME detection. Native
pickers and the same operations are on `window.desktop.fs`.

### System (`crinoid/clipboard`, `crinoid/notifications`, `crinoid/shell`, `crinoid/system`, `crinoid/power`, `crinoid/network`, `crinoid/secrets`)

Clipboard text + PNG images, native notifications, allowlisted shell (`openExternal`, `openPath`,
`showItemInFolder`, `trashItem`), `collectSystemInfo` (OS/arch/CPU/memory/app), battery + power
suspend/resume/lock, connectivity status, and OS-keychain secrets via `createSecretStore`.

### Networking (`crinoid/api`, `crinoid/websocket`, `crinoid/sse`, `crinoid/transfers`, `crinoid/proxy`)

`createApiClient` (JSON, auth/request-id headers, retries with backoff over 408/425/429/5xx, timeout,
offline short-circuit), `createWebSocketClient` (allowlist, queue-until-open, exponential-backoff reconnect),
`createSseClient`, `createTransferManager` (session downloads with progress + `cancelAll`, uploads), and
proxy resolution for system/direct/fixed/pac.

### Auth (`crinoid/auth`, `crinoid/deep-link`)

`createSessionManager` (login/logout + persisted session + `restore()`), `createTokenManager` (expiry skew +
refresh provider), `createOAuthClient` (PKCE, authorize URL, state validation, code exchange). Deep links
route `myapp://route/id?query` via `parseDeepLink` / `createDeepLinkRouter`; `findDeepLinkArgument` reads a
launch command line.

### Data (`crinoid/sqlite`, `crinoid/database`, `crinoid/cache`, `crinoid/storage`, `crinoid/indexeddb`, `crinoid/data-transfer`)

`createSqliteDriver` (node:sqlite, WAL, foreign keys), `createDatabase` (`run`/`all` + versioned
migrations + `repository({ table, primaryKey })` CRUD), `createCache` (TTL + de-duplicated loads),
`createKeyValueStorage` (namespaced memory/file JSON), `createIndexedDbStore`, and `createDataTransfer`
(versioned export/import + backup/restore).

### Tasks (`crinoid/tasks`)

`createTaskContext` (status, progress, cancellation, retry), `createJobQueue({ concurrency })`,
`createScheduler` (interval/cron, `nextCronRun`), `createWorkerPool`, plus `createUpdateService`,
`parseVersion`/`compareVersions`, `resolveChannel`.

### Updates and release (`crinoid/tasks`)

`createUpdateService({ adapter, currentVersion, channel })` does check/download/install/rollback and
progress subscription; renderer drives it through `window.desktop.updates`. Linux updates are delegated to
the package manager by design.

### Security (`crinoid/security`)

`buildContentSecurityPolicy` / `installContentSecurityPolicy`, `isAllowedExternalUrl` (https + mailto only),
`isPermissionAllowed` (notifications only), and sender validation in the IPC registry. Every window is
created with `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`. Do not weaken these.

### Errors and observability (`crinoid/crash-reporting`, `crinoid/metrics`, `crinoid/trace`, `crinoid/feedback`, `crinoid/observability`)

`createCrashReporter` (normalize, scrub secrets, never throws), `createMetrics` (counters + timing
percentiles), `createTracer` (`wrapIpc`/`wrapTask`), `buildFeedbackReport`, and `createObservability`
composing all of them. `createIpcRegistry` accepts `tracer`/`metrics` to emit `ipc:<channel>` spans.

### Internationalization (`crinoid/i18n`, `crinoid/react`)

`react-intl` messages through `DesktopProviders`/`LocaleProvider`; `detectLocale`, `resolveLocale`,
`directionForLocale` (RTL), `createFormatters` (timezone, number/currency/percent, date/relative). Locale
switching uses `useLocale().setLocale(...)`; `desktop.app.getLocale()` reads the OS locale.

### Common app capabilities (`crinoid/settings`, `crinoid/about`, `crinoid/help`, `crinoid/keybindings`, `crinoid/command-palette`, `crinoid/search`, `crinoid/favorites`, `crinoid/history`, `crinoid/drag-drop`)

Versioned `createSettings` with migrations, About info, allowlisted help links, in-app keybindings
(`parseKeybinding`/`matchesKeybinding` + `useKeyboardShortcuts`), command registry ranked with `fuzzyScore`/
`rankBy`, favorites, undo/redo via `createHistory`, and file/text drag-and-drop
(`readDroppedItems`/`createDropController`; resolve OS paths with `desktop.fs.pathForFile(file)`).

### Desktop-only (`crinoid/deep-link`, `crinoid/auto-launch`, `crinoid/single-instance`, `crinoid/window`)

Deep links, login-at-startup (`createAutoLaunch`), single-instance lock (`createSingleInstance` /
`acquireSingleInstance`), tray, notifications, global shortcuts, clipboard images.

## Renderer bridge (`window.desktop`)

Typed via `DesktopAPI` from `crinoid/ipc`. Fixed capability surface - there is no generic invoke.

| Namespace | Methods |
| --- | --- |
| `app` | `getVersion`, `getLocale`, `setBadge`, `requestAttention`, `setProgress`, `flash`, `onDeepLink` |
| `window` | `minimize`, `maximize`, `close`, `toggleFullScreen`, `setAlwaysOnTop`, `open(id)` |
| `dialog` | `openFile`, `openFiles`, `openDirectory`, `saveFile`, `confirm` |
| `fs` | `pickFile`, `pickDirectory`, `readText`, `writeText`, `readJson`, `writeJson`, `list`, `exists`, `copy`, `move`, `remove`, `mime`, `pathForFile` |
| `shell` | `openExternal`, `openPath`, `showItemInFolder`, `trashItem` |
| `contextMenu` | `show` |
| `clipboard` | `readText`, `writeText`, `readImage`, `writeImage`, `hasImage`, `hasHtml`, `clear` |
| `notifications` | `show` |
| `system` / `power` / `network` | `info()`, `status()`, `onSuspend`/`onResume`/`onChange` |
| `secrets` | `get`, `set`, `has`, `remove` |
| `auth` | `login`, `logout`, `session`, `tokens`, `onChanged` |
| `updates` | `check`, `download`, `install`, `rollback`, `setChannel`, `onProgress` |
| `transfers` | `download`, `cancelAll`, `onProgress` |
| `store` / `preferences` / `recentFiles` | `get`/`set`/`onChange`, `get`/`set`/`all`, `add`/`list`/`remove`/`clear` |
| `feedback` / `crash` | `submit`, `report` |

## Testing (`crinoid/testing`, `crinoid/testing/react`, `crinoid/testing/e2e`)

- Unit: `createDeferred`, `waitFor`, `createTempDir`, `withTempDir`.
- IPC: `createFakeIpcPair` (enforces the same trust/payload rules as production).
- Main: `createCollectingLogger`, `createMainDeps`, `createElectronMock`.
- Renderer: `TestProviders`, `createDesktopApiStub`, `installDesktopBridge`.
- E2E: `openFirstWindow`, `waitForWindowTitle`, `waitForWindow`, `closeApplication` (no Playwright dependency).

Stack used by the repo: Vitest + React Testing Library for unit/component, Playwright reserved for critical
Electron flows. Stub native dialogs/notifications/shell - never depend on real OS UI in tests.

## Build, package, release

```bash
pnpm dev                 # electron-forge start
pnpm package             # electron-forge package (run on the target platform)
pnpm make                # installers / distributables
pnpm update crinoid      # pick up infrastructure updates
```

Versioning: patch fixes bugs, minor adds backward-compatible exports, major changes/removes APIs and lists
every required consumer change in `CHANGELOG.md`. Application source is never modified automatically.

## Getting depth

The package ships authoritative docs - read them instead of guessing exports:

- `node_modules/crinoid/API.md` - full public API by entry point and capability.
- `node_modules/crinoid/README.md` - copy-paste usage for every feature.
- `node_modules/crinoid/src/*.ts` - exact types and function signatures.

When in doubt, open the subpath's source file and use its exported names as-is.
