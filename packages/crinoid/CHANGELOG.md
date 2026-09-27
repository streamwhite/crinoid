# Changelog

## Unreleased

### Added

- `./environment` — `resolveEnvironment`, `environmentFromProcess`, `readEnvValue` for `development` / `test` / `production`.
- `./lifecycle` — `createAppLifecycle` plus `createShutdownManager` and `withTimeout` for graceful shutdown.
- `./errors` — `installGlobalErrorHandlers` and `normalizeError` for global `uncaughtException` / `unhandledRejection` reporting.
- `./logging` — leveled structured logger, `createConsoleSink`, and `createRotatingFileSink`.
- `./logging` — adds `createMultiSink` to fan structured records out to several sinks (for example console + rotating file).
- `./crash-reporting` — `createCrashReporter` and `scrubContext` for reporting crashes with app metadata and redacting secret-looking context.
- `./metrics` — `createMetrics` for counters and timing summaries (`count`/`min`/`max`/`avg`/`p50`/`p95`).
- `./trace` — `createTracer` with `trace`, `wrapIpc`, and `wrapTask` for IPC and task spans.
- `./feedback` — `buildFeedbackReport` and `isFeedbackReport` for user feedback / report-issue payloads.
- `./i18n` — `detectLocale`, `resolveLocale`, `directionForLocale`, `createFormatters`, and `RTL_LOCALES` for locale detection, switching, time zone, number/currency/date formatting, and RTL.
- `./observability` — `createObservability` composes the logger, metrics, tracer, crash reporter, and feedback sink.
- `./search` — `fuzzyScore` and `rankBy` for subsequence scoring and ranked filtering.
- `./command-palette` — `createCommandRegistry` for registering, searching, and running commands.
- `./favorites` — `createFavorites` for toggling pinned items with a reactive store.
- `./history` — `createHistory` for undo/redo with past/present/future and a configurable limit.
- `./settings` — `createSettings` for versioned, migratable typed settings.
- `./about` — `createAboutInfo` and `formatAboutText`.
- `./help` — `createHelpService` for allowlisted help links.
- `./keybindings` — `parseKeybinding`, `matchesKeybinding`, `formatKeybinding`, and `createKeybindingRegistry`.
- `./drag-drop` — `readDroppedItems`, `readDroppedText`, and `createDropController`.
- `./single-instance` — `createSingleInstance` for the instance lock, duplicate quit, and second-launch focus.
- `./auto-launch` — `createAutoLaunch` for OS login-at-startup enable/disable/toggle.
- `./deep-link` — adds `createDeepLinkRouter` and `findDeepLinkArgument`.
- `./clipboard` — adds PNG image `readImage` / `writeImage` alongside text and image/HTML detection.
- `./ipc` — adds `clipboard.read-image` / `clipboard.write-image` channels and `desktop.fs.pathForFile(file)` for dropped files.
- `./react` — adds `useKeyboardShortcuts` for in-app keybindings.
- `./testing` — unit fixtures, a fake IPC pair, a mock Electron API, collection logger, and main deps fakes.
- `./testing/react` — `TestProviders`, `createDesktopApiStub`, and `installDesktopBridge`.
- `./testing/e2e` — structural E2E helpers for windows and application lifecycle.
- `./ipc` — adds `app.get-locale`, `feedback.submit`, and `crash.report` channels, `DesktopAPI.app.getLocale`, `DesktopAPI.feedback`, and `DesktopAPI.crash`; `createIpcRegistry` now records `ipc.duration` / `ipc.calls` and emits `ipc:<channel>` spans when a tracer/metrics are supplied.
- `./tasks` — `createTaskContext` and `createJobQueue` accept a `tracer` and emit `task:<name>` spans.
- `./main` — `createMainProcess` now accepts `observability` (log file/rotation, crash sink, feedback sink, level) and `autoLaunch`, and wires metrics, tracing, crash reporting, global error reporting, clipboard images, instance-lock focus, and logger flush by default.
- `./window` — `createWindowRegistry` now tracks ids, closes all, and broadcasts to live windows. Adds `ensureVisibleOnDisplays`, `WindowBounds`, `WindowChromeOptions`, and `isFullScreen` window state.
- `./dialogs` — `createDialogService` with `openFile`, `openFiles`, `openDirectory`, `saveFile`, and `confirm` plus payload validators.
- `./shortcuts` — `createShortcutManager` for registration-tracked global shortcuts.
- `./tray` — `createTrayController` for system tray with optional minimize-to-tray and close-to-tray.
- `./menu` — `createMenuService` and `defaultApplicationMenuTemplate`.
- `./context-menu` — `createContextMenuHandler` and `isContextMenuRequest` for renderer-driven context menus.
- `./integration` — `createPlatformIntegration` for dock/taskbar badges, attention, progress, and flashing.
- `./reactive` — `createStore` with `get`/`set`/`update`/`subscribe`/`select` for global and reactive state.
- `./persistent` — `createPersistentStore` merges persisted values with defaults and auto-persists changes.
- `./state-sync` — `createStateSync` broadcasts a store to every window and emits initial state to new windows.
- `./preferences` — `createPreferences` for typed, persisted user preferences.
- `./recent-items` — `createRecentItems` for recent files/projects with dedupe, ordering, and a limit.
- `./paths` — `joinPath`, `normalizePath`, `relativePath`, `ensureExtension`, `isSubPath`, `uniquePath`, and friends.
- `./mime` — `detectMimeType`, `getFileCategory`, `isTextMimeType`.
- `./fs` — `readText`/`writeText`/`readJson`/`writeJson`/`listDirectory`/`copyPath`/`movePath`/`removePath`/`fileExists`/`ensureDirectory`.
- `./stream` — `readTextStream` and `writeTextStream` for chunked, progress-reporting access.
- `./watch` — `watchPath` and `createNodeWatcher` for debounced file monitoring.
- `./clipboard` — `createClipboardService` for text plus `hasImage`/`hasHtml`/`clear`.
- `./notifications` — `createNotificationService` with click/close handlers and support detection.
- `./shell` — `createShellService` for external URLs, `openPath`, `showItemInFolder`, and `trashItem`.
- `./system` — `collectSystemInfo` (OS/arch/release/hostname, CPU model and cores, memory, app facts) and `formatBytes`.
- `./power` — `readBatteryStatus` and `createPowerMonitor` for suspend/resume/lock/unlock events.
- `./network` — `readNetworkStatus` and `createNetworkMonitor` for online/offline transitions.
- `./secrets` — `createSecretStore` backed by `safeStorage` for encrypted token storage (Keychain / Credential Manager).
- `./security` — `buildContentSecurityPolicy` and `installContentSecurityPolicy` alongside the existing URL, sender, and permission policies.
- `./websocket` — `createWebSocketClient` with allowlist, message queue, exponential-backoff reconnect, and lifecycle events.
- `./sse` — `createSseClient` for server-sent events with reconnect handling.
- `./transfers` — `createTransferManager` for download/upload progress, completion, and cancellation.
- `./proxy` — `resolveProxyConfig` and `applyProxy` for system/direct/fixed/PAC proxy configuration.
- `./auth` — `createSessionManager` (login/logout/restore), `createTokenManager` (expiry + refresh), and `createOAuthClient` with PKCE and callback parsing.
- `./deep-link` — `parseDeepLink`, `parseDeepLinkPath`, `isDeepLink` for custom-protocol routing.
- `./cache` — `createCache` for TTL local caching with in-flight de-duplication.
- `./database` — `createDatabase`, `createRepository`, and `runMigrations` against any `SqlDriver`.
- `./sqlite` — `createSqliteDriver` backed by `node:sqlite` with WAL and foreign keys enabled.
- `./data-transfer` — `createDataTransfer` for export/import and backup/restore.
- `./indexeddb` — `createIndexedDbStore` for renderer-side IndexedDB access.
- `./storage` — adds `createKeyValueStorage` namespacing and an optional `keys()` on `Storage`.
- `./tasks` — `createTaskContext` (status/progress/cancel/retry), `createJobQueue` (concurrency control), `createScheduler`/`nextCronRun`, `createWorkerPool`, `createUpdateService` with version helpers and release channels.
- `./ipc` — update channels and a `desktop.updates` bridge (check/download/install/rollback/channel/progress).
- `./api` — `createApiClient` now supports retries with backoff, timeout, offline short-circuit, abort, and retry hooks.
- `./ipc` — `DESKTOP_CHANNELS`, `createIpcRegistry` for typed auto-registered handlers, and `createIpcInvoker`. Renderer bridge now covers fullscreen, always-on-top, child-window open, all dialogs, context menus, filesystem, recent files, state, preferences, clipboard, notifications, shell, system, power, network, transfers, secrets, and taskbar integration.
- `./react` — `ErrorBoundary` for renderer-side error handling.
- `./main` — `acquireSingleInstance`, `createChildWindow`; `createMainProcess` now accepts `windows`, `childWindows`, `menuTemplate`, `tray`, `shortcuts`, `state`, `recentFiles`, `auth`, `updater`, `updaterAdapter`, `releaseChannel`, `proxy`, `environment`, `onShutdown`, and `onError`. It installs a CSP by default and wires clipboard, notifications, shell, system, power, network, transfers, auth, updates, and secret storage.

## 0.1.0

Initial release.

### Exports

- `.` — config, storage, api, ipc, security, logging, window, module-runtime factories and types
- `./main` — `createMainProcess`, `createDesktopWindow`, dependency-injectable main IPC
- `./preload` — `exposeDesktopApi`
- `./react` — `DesktopProviders`, `ThemeProvider`, `AppShell`, generic states
- `./ipc`, `./storage`, `./config`, `./api` — focused factories
- `./forge`, `./vite` — packaging configuration helpers
- `./types` — shared TypeScript types
