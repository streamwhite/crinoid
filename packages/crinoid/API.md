# Public API

## Entry points

| Subpath | Purpose |
| --- | --- |
| `crinoid` | config, environment, lifecycle, shutdown, errors, storage, api, ipc, security, logging, window, module-runtime factories |
| `.../main` | `createMainProcess`, `createDesktopWindow`, `acquireSingleInstance`, injectable main IPC |
| `.../preload` | `exposeDesktopApi` |
| `.../react` | `DesktopProviders`, `LocaleProvider`, `ThemeProvider`, `AppShell`, `ErrorBoundary`, `useKeyboardShortcuts`, generic states |
| `.../ipc` | `IPC_CHANNELS`, `DESKTOP_CHANNELS`, `createChannel`, `createIpcRegistry`, `createIpcInvoker` |
| `.../storage` | memory and file storage |
| `.../config` | `createDesktopConfig` |
| `.../environment` | `resolveEnvironment`, `environmentFromProcess`, `readEnvValue` |
| `.../lifecycle` | `createAppLifecycle`, `createShutdownManager`, `withTimeout` |
| `.../errors` | `installGlobalErrorHandlers`, `normalizeError` |
| `.../logging` | `createLogger`, `createConsoleSink`, `createMultiSink`, `createRotatingFileSink`, `levelFromEnvironment` |
| `.../crash-reporting` | `createCrashReporter`, `scrubContext` |
| `.../metrics` | `createMetrics` (counters, timings, percentiles) |
| `.../trace` | `createTracer` with `wrapIpc` / `wrapTask` |
| `.../feedback` | `buildFeedbackReport`, `isFeedbackReport` |
| `.../i18n` | `detectLocale`, `resolveLocale`, `directionForLocale`, `createFormatters`, `RTL_LOCALES` |
| `.../observability` | `createObservability` composing logging, metrics, tracing, crash reporting, and feedback |
| `.../search` | `fuzzyScore`, `rankBy` |
| `.../command-palette` | `createCommandRegistry` |
| `.../favorites` | `createFavorites` |
| `.../history` | `createHistory` (undo/redo) |
| `.../settings` | `createSettings` with versioned migrations |
| `.../about` | `createAboutInfo`, `formatAboutText` |
| `.../help` | `createHelpService` |
| `.../keybindings` | `parseKeybinding`, `matchesKeybinding`, `formatKeybinding`, `createKeybindingRegistry` |
| `.../drag-drop` | `readDroppedItems`, `readDroppedText`, `createDropController` |
| `.../testing` | fake IPC pair, Electron mock, main deps, fixtures, E2E helpers |
| `.../testing/react` | `TestProviders`, `createDesktopApiStub`, `installDesktopBridge` |
| `.../testing/e2e` | `openFirstWindow`, `waitForWindowTitle`, `waitForWindow`, `closeApplication` |
| `.../window` | `createWindowRegistry`, `ensureVisibleOnDisplays`, `loadWindowState`, `saveWindowState` |
| `.../dialogs` | `createDialogService`, payload validators |
| `.../shortcuts` | `createShortcutManager` |
| `.../tray` | `createTrayController` |
| `.../menu` | `createMenuService`, `defaultApplicationMenuTemplate` |
| `.../context-menu` | `createContextMenuHandler`, `isContextMenuRequest` |
| `.../integration` | `createPlatformIntegration` |
| `.../reactive` | `createStore` |
| `.../persistent` | `createPersistentStore` |
| `.../state-sync` | `createStateSync` |
| `.../preferences` | `createPreferences` |
| `.../recent-items` | `createRecentItems` |
| `.../paths` | path helpers |
| `.../mime` | `detectMimeType`, `getFileCategory`, `isTextMimeType` |
| `.../fs` | file read/write/list/copy/move/remove |
| `.../stream` | `readTextStream`, `writeTextStream` |
| `.../watch` | `watchPath`, `createNodeWatcher` |
| `.../clipboard` | `createClipboardService` (text + PNG image) |
| `.../notifications` | `createNotificationService` |
| `.../shell` | `createShellService` |
| `.../system` | `collectSystemInfo`, `formatBytes` |
| `.../power` | `readBatteryStatus`, `createPowerMonitor` |
| `.../network` | `readNetworkStatus`, `createNetworkMonitor` |
| `.../secrets` | `createSecretStore` |
| `.../security` | CSP builders and URL/sender/permission policies |
| `.../websocket` | `createWebSocketClient` |
| `.../sse` | `createSseClient` |
| `.../transfers` | `createTransferManager` |
| `.../proxy` | `resolveProxyConfig`, `applyProxy` |
| `.../auth` | `createSessionManager`, `createTokenManager`, `createOAuthClient` |
| `.../deep-link` | `parseDeepLink`, `parseDeepLinkPath`, `isDeepLink`, `createDeepLinkRouter`, `findDeepLinkArgument` |
| `.../single-instance` | `createSingleInstance` |
| `.../auto-launch` | `createAutoLaunch` (OS startup) |
| `.../cache` | `createCache` |
| `.../database` | `createDatabase`, `createRepository`, `runMigrations` |
| `.../sqlite` | `createSqliteDriver` |
| `.../data-transfer` | `createDataTransfer` |
| `.../indexeddb` | `createIndexedDbStore` |
| `.../tasks` | `createTaskContext`, `createJobQueue`, `createScheduler`, `createWorkerPool`, `createUpdateService` |
| `.../api` | `createApiClient`, `ApiError`, `getErrorMessage` |
| `.../forge` | `createForgeConfig`, `securePackagerConfig` |
| `.../vite` | `createMainViteConfig`, `createPreloadViteConfig`, `createRendererViteConfig` |
| `.../types` | shared TypeScript types |

## Foundational capabilities

`createMainProcess` wires these by default. Each is also exported so it can be composed manually.

- **Environment** — `resolveEnvironment` maps `NODE_ENV` and `app.isPackaged` onto `development`, `test`, or `production`. Unknown values fall back to the packaging state.
- **Lifecycle** — `createAppLifecycle` owns `ready`, `activate`, `window-all-closed`, and `before-quit`.
- **Graceful shutdown** — `createShutdownManager` runs ordered, isolated cleanup tasks with a per-task timeout. Re-entrant calls resolve to the same run.
- **Global errors** — `installGlobalErrorHandlers` reports `uncaughtException` and `unhandledRejection` through the logger and an optional `onError` hook.
- **Global logging** — `createLogger` emits structured JSON records with level filtering and pluggable sinks (`createConsoleSink`, `createRotatingFileSink`).
- **Typed IPC** — `createIpcRegistry` registers typed channels, enforces the trusted sender origin and payload validation, and returns a disposer. `createIpcInvoker` builds the matching renderer call.
- **Multi-window** — `createWindowRegistry` tracks windows by id, reuses live ones, broadcasts to all live windows, and closes all on demand. `DesktopWindowOptions` accepts `chrome` for custom title bars, transparency, sizing, and initial fullscreen/always-on-top.

## Window and interface capabilities

- **Main and child windows** — `createMainProcess` opens `window` (main) plus `windows[]`; `childWindows` defines named dialogs opened through `DesktopAPI.window.open(id)`. `createChildWindow(parent, options)` is available directly.
- **State persistence** — `createDesktopWindow` restores size, position, maximized, and fullscreen state. `ensureVisibleOnDisplays` drops off-screen coordinates so a window re-centers when a monitor is removed.
- **Dialogs** — `createDialogService` wraps open-file, open-files, open-directory, save-file, and a two-button confirm. Payloads cross IPC through `isSaveDialogRequest` / `isConfirmDialogOptions`.
- **Tray** — `createTrayController` builds the tray menu, wires click-to-show, and optionally hides the window on minimize or close.
- **Menus** — `createMenuService` installs an application menu (role-based by default, no hardcoded labels) and pops up context menus.
- **Context menu** — `createContextMenuHandler` turns a validated renderer request into a native menu and resolves the selected item id.
- **Shortcuts** — `createShortcutManager` registers global accelerators, tracks ownership, and releases them on dispose.
- **Fullscreen / always-on-top** — exposed to the renderer via `desktop.window.toggleFullScreen()` and `desktop.window.setAlwaysOnTop(flag)`.
- **Dock / Taskbar** — `createPlatformIntegration` sets badges, requests attention, reports progress, and flashes the taskbar.

## Application state

- **Global store** — `createStore` holds typed state with `get`/`set`/`update`/`subscribe`, plus derived `select` stores.
- **Reactive state** — subscribers receive `(value, previous)`; selectors only notify when the derived value changes.
- **Persistent store** — `createPersistentStore` loads from a `Storage`, merges with defaults, and writes back on change.
- **Cross-window sync** — `createStateSync` broadcasts a store to every window and can emit the initial state to a specific window. `createMainProcess` wires this when `state` is provided.
- **Preferences** — `createPreferences` wraps a persistent store with per-key `get`/`set`, `reset`, and change events.
- **Recent files / projects** — `createRecentItems` keeps an ordered, de-duplicated, capped list with `add`/`remove`/`clear`.

```ts
createMainProcess({
  config,
  window,
  state: { initial: { theme: 'light' }, persistPath: join(app.getPath('userData'), 'state.json') },
  recentFiles: { limit: 10 }
})
```

## File system

- **Pickers** — `desktop.fs.pickFile()` / `desktop.fs.pickDirectory()` wrap the native open dialogs (the dialog section also exposes `openFiles` and `saveFile`).
- **Read / write** — `readText`, `writeText`, `readJson`, `writeJson`, `listDirectory`, `copyPath`, `movePath`, `removePath`, `fileExists`, `ensureDirectory`.
- **Streaming** — `readTextStream` and `writeTextStream` process chunked data and report byte progress.
- **Watching** — `watchPath` debounces `fs.watch` events; the renderer can start a watch and receive changes through the bridge.
- **Paths** — `joinPath`, `normalizePath`, `relativePath`, `ensureExtension`, `isSubPath`, `uniquePath`.
- **MIME** — `detectMimeType`, `getFileCategory`, `isTextMimeType`.
- **Recent files** — recorded through `createRecentItems` and surfaced as `desktop.recentFiles`.

## System capabilities

- **Clipboard** — `createClipboardService` reads/writes text and PNG images (`readImage`/`writeImage` as `Uint8Array`) and checks for image/HTML content; exposed as `desktop.clipboard`.
- **Native notifications** — `createNotificationService` shows notifications with click/close handlers when supported; exposed as `desktop.notifications.show`.
- **Shell** — `createShellService` opens external URLs (allowlisted), opens paths, reveals items, and moves files to trash; exposed as `desktop.shell`.
- **System info** — `collectSystemInfo` reports OS/platform/arch/release/hostname, CPU model and cores, memory totals, and app facts; exposed as `desktop.system.info`.
- **Battery** — `readBatteryStatus` reports charging state; `createPowerMonitor` forwards suspend/resume/lock/unlock; exposed as `desktop.power.status`.
- **Network** — `readNetworkStatus` and `createNetworkMonitor` report connectivity; exposed as `desktop.network.status`.
- **Secrets** — `createSecretStore` encrypts values through the OS keychain (`safeStorage`); exposed as `desktop.secrets`.

## Networking

- **HTTP client** — `createApiClient` handles JSON requests with auth/request-id headers, retries (backoff over 408/425/429/5xx), timeout, offline short-circuit, and retry hooks.
- **WebSocket** — `createWebSocketClient` connects with an allowlist, queues messages until open, reconnects with exponential backoff, and reports events.
- **SSE** — `createSseClient` wraps `EventSource` with reconnect handling and status tracking.
- **Retry / Timeout** — configured through `ApiClientOptions` (`retries`, `retryDelayMs`, `timeoutMs`).
- **Offline detection / Network status** — `isOnline` short-circuits API calls; `readNetworkStatus` and `createNetworkMonitor` report connectivity, surfaced as `desktop.network`.
- **Download Manager** — `createTransferManager` tracks `session` downloads with progress, completion, interruption, and `cancelAll`; surfaced as `desktop.transfers`.
- **Upload Manager** — `createUpload` exposes a start/progress/complete/cancel lifecycle.
- **Proxy** — `resolveProxyConfig` / `applyProxy` support `system`, `direct`, `fixed`, and `pac` modes with bypass rules; `createMainProcess` accepts a `proxy` option.

## Authentication

- **Login / Logout** — `createSessionManager` authenticates credentials and persists the session.
- **Session management / auto-restore** — `restore()` loads a persisted session and validates it on startup; `createMainProcess` restores automatically when an `auth` bridge is supplied.
- **Token management** — `createTokenManager` tracks expiry with a safety skew and refreshes through a provider.
- **OAuth** — `createOAuthClient` implements PKCE (`createPkcePair`), builds the authorize URL, validates `state`, and exchanges the callback code.
- **Deep link / custom protocol** — `parseDeepLink` and `parseDeepLinkPath` route `myapp://route/id?query` links; `createOAuthClient` parses `?code=&state=` callbacks.
- **Renderer bridge** — `desktop.auth.login/logout/session/tokens/onChanged`.

## Database and local data

- **SQLite** — `createSqliteDriver` opens a `node:sqlite` database with WAL and foreign keys; `createDatabase` exposes `run`/`all`.
- **Migrations** — `runMigrations` applies pending migrations in order and records them; `createDatabase` runs them on open.
- **Repository** — `database.repository({ table, primaryKey })` provides `find`/`list`/`insert`/`update`/`remove` with identifier validation.
- **Local cache** — `createCache` caches loader results with a TTL and de-duplicates concurrent loads.
- **Key-value storage** — `createKeyValueStorage` namespaces a `Storage`; memory and JSON-file backings ship by default.
- **IndexedDB** — `createIndexedDbStore` wraps a renderer IndexedDB object store.
- **Import / export / backup / restore** — `createDataTransfer` exports a versioned snapshot and imports it (merge or replace), plus file-backed backup and restore.

## Task system

- **Background task** — `createTaskContext` runs a worker with status tracking, progress, cancellation, and retry.
- **Job queue / concurrency control** — `createJobQueue({ concurrency })` schedules jobs, respects a limit, retries failures, and cancels on `clear`.
- **Cron / scheduler** — `createScheduler` runs jobs on an interval or cron spec; `nextCronRun` computes the next occurrence.
- **Worker / worker pool** — `createWorkerPool({ size, createWorker })` runs tasks across reusable workers.
- **Progress / cancellation / retry / status** — surfaced through `TaskContext` and queue options.

## Updates and releases

- **Update check / download / install** — `createUpdateService` wraps an adapter and reports availability based on `currentVersion`.
- **Update progress** — forwarded through `subscribeProgress` and broadcast as `desktop.updates.onProgress`.
- **Rollback / recovery** — `rollback()` reinstalls the current version and invokes `onRollback`.
- **App version management** — `parseVersion`, `compareVersions`, `isNewerVersion`, `isPrerelease`.
- **Release channel** — `DEFAULT_CHANNELS` (`stable`, `beta`) and `resolveChannel`; `createMainProcess` accepts `releaseChannel`.
- **Renderer bridge** — `desktop.updates.check/download/install/rollback/setChannel/onProgress`.

## Security

- **Context isolation / sandbox / no Node in renderer** — every window is created with `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`; only the narrow `desktop` bridge is exposed.
- **CSP** — `buildContentSecurityPolicy` produces a restrictive policy (`default-src 'self'`, `object-src 'none'`, no `unsafe-eval`) and `installContentSecurityPolicy` applies it to a session. `createMainProcess` installs it by default.
- **IPC authorization** — `createIpcRegistry` rejects untrusted senders and invalid payloads before a handler runs.
- **Permission control** — `isPermissionAllowed` and the permission policy handlers allow only approved permissions (notifications).
- **URL policy** — `isAllowedExternalUrl` allows only `https:` and `mailto:`.
- **Secret / token storage** — `createSecretStore` uses the OS keychain and throws when encryption is unavailable.
- **Safe renderer API** — the preload exposes a fixed capability surface; there is no generic `invoke`/`send`/`execute` channel.

## Errors and observability

- **Error boundary** — `ErrorBoundary` (from `.../react`) catches renderer render errors and calls `onError` with the captured `Error`.
- **Crash reporting** — `createCrashReporter` normalizes thrown values, attaches app version/platform/time, scrubs secret-looking context keys, and never throws from its sink. Renderer `ErrorBoundary` errors can be forwarded through `desktop.crash.report(...)`.
- **Structured logging** — `createLogger` emits JSON `LogRecord`s with level filtering; `createConsoleSink` and `createMultiSink` fan records out to every configured sink.
- **Log rotation** — `createRotatingFileSink` appends JSON lines and rotates when a size cap is reached, keeping `maxFiles` backups.
- **Performance metrics** — `createMetrics` records counters and timing samples with `count`/`min`/`max`/`avg`/`p50`/`p95` summaries.
- **IPC tracing** — `createIpcRegistry` accepts a `tracer` and `metrics`, so every handled channel emits an `ipc:<channel>` span and records `ipc.duration` / `ipc.calls`.
- **Task tracing** — `createTaskContext({ tracer })` and `createJobQueue({ tracer })` wrap runs in `task:<name>` spans (or pass `name` per job).
- **User feedback** — `buildFeedbackReport` validates and stamps feedback; the renderer bridge exposes `desktop.feedback.submit(...)`.
- **Composition** — `createObservability({ appVersion, platform, arch, logFile? })` builds the logger, metrics, tracer, crash reporter, and feedback sink together. `createMainProcess` wires it by default and accepts an `observability` option.

## Internationalization

- **i18n** — renderers use `react-intl`; `DesktopProviders` / `LocaleProvider` supply `IntlProvider` messages and locale.
- **Locale detection** — `detectLocale({ preference, system, available, fallback })` matches preference, then system locale, then language subtag.
- **Locale switching** — `LocaleProvider`'s `useLocale().setLocale(locale)` switches messages and notifies `onLocaleChange`. `desktop.app.getLocale()` exposes the OS locale from the main process.
- **Timezone** — `createFormatters(locale, { timeZone })` applies an explicit time zone to date formatting.
- **Number / currency / percent** — `formatNumber`, `formatCurrency`, `formatPercent`.
- **Date formatting** — `formatDate` and `formatRelativeTime`.
- **RTL support** — `directionForLocale` / `resolveLocale` classify RTL languages; `LocaleProvider` sets the document `dir` and `lang` attributes.

## Common application capabilities

- **Settings** — `createSettings({ storage, defaults, version, migrate })` persists a typed object under a versioned envelope and migrates older payloads.
- **About** — `createAboutInfo` collects name/version/platform/arch and runtime versions; `formatAboutText` renders a plain-text block.
- **Help** — `createHelpService` opens allowlisted (https) help links and reports whether the key exists.
- **Feedback** — `buildFeedbackReport` plus `desktop.feedback.submit(...)`; see the observability section.
- **Keyboard shortcuts** — global accelerators use `createShortcutManager`; in-app bindings use `parseKeybinding` / `matchesKeybinding` / `createKeybindingRegistry` and the `useKeyboardShortcuts` React hook.
- **Command palette** — `createCommandRegistry` registers commands, ranks them with `search`, and runs them by id.
- **Search** — `fuzzyScore` and `rankBy` provide subsequence scoring and ranked filtering.
- **Recent items** — `createRecentItems` (see application state).
- **Favorites** — `createFavorites` toggles pinned items with a reactive store.
- **Import / export** — `createDataTransfer` (see database and local data).
- **Undo / redo** — `createHistory` tracks past/present/future with a configurable limit.
- **Drag and drop** — `readDroppedItems` / `readDroppedText` read a `DataTransfer`; `createDropController` handles dragover and drop events.

## Testing utilities

- **Unit test utilities** — `createDeferred`, `waitFor`, `createTempDir`, `withTempDir` from `.../testing`.
- **IPC test utilities** — `createFakeIpcPair` wires a fake `ipcMain` to a fake `ipcRenderer` that enforces the same trust/payload rules as production.
- **Main process test utilities** — `createCollectingLogger` records log records; `createMainDeps` builds injectable `DesktopMainDeps` fakes.
- **Renderer test utilities** — `TestProviders` wraps `IntlProvider` + `ThemeProvider`; `createDesktopApiStub` builds a deep stub and `installDesktopBridge` sets `window.desktop`.
- **E2E test utilities** — `openFirstWindow`, `waitForWindowTitle`, `waitForWindow`, `closeApplication` operate on structural application/window types (no Playwright dependency).
- **Mock Electron API** — `createElectronMock` models `app`, `BrowserWindow`, dialogs, clipboard, shell, notifications, menus, tray, secret storage, IPC, shortcuts, screen, and power monitor.
- **Test fixtures** — `createBrowserWindowConstructor`, `createMockDialog`, `createElectronMock`.

## Desktop capabilities

- **Deep links** — `parseDeepLink`/`createDeepLinkRouter` dispatch `myapp://route/id` URLs; `findDeepLinkArgument` extracts the URL from a launch command line; `createMainProcess` registers the custom protocol and forwards links to the renderer when `features.deepLink` is on.
- **File drag and drop** — renderer drops use `readDroppedItems` / `createDropController`; `desktop.fs.pathForFile(file)` resolves an OS path through Electron `webUtils` (dropped `File.path` is unavailable in modern Electron).
- **OS startup** — `createAutoLaunch({ getLoginItemSettings, setLoginItemSettings }, { openAsHidden, args })` enables/disables/toggles login-at-startup; `createMainProcess` applies the `autoLaunch` option on ready.
- **Single instance** — `createSingleInstance({ app, onSecondInstance, focus })` acquires the instance lock, quits duplicates, and focuses the main window on a second launch.
- **System tray** — `createTrayController` (see window and interface capabilities).
- **Notifications** — `createNotificationService` (see system capabilities).
- **Global shortcuts** — `createShortcutManager` for global accelerators plus `createKeybindingRegistry` for in-app bindings.
- **Clipboard image** — `desktop.clipboard.readImage()` / `writeImage(png)` move PNG bytes across IPC.

## Stability rules

- Patch releases fix bugs without changing the public API.
- Minor releases add backward-compatible exports.
- Major releases remove or rename exports, change signatures, or change configuration types. Their `CHANGELOG.md` lists every required consumer change.
- The package never modifies consumer source files during install or update.
