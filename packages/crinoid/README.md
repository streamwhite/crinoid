# crinoid

Reusable Electron main/preload/renderer infrastructure published as a normal package.

## Install

```bash
pnpm add crinoid
```

Peer dependencies you must install yourself:

```bash
pnpm add react react-dom electron
```

## Usage

### Main process

```ts
// src/main/index.ts
import { createDesktopConfig } from 'crinoid/config'
import { createMainProcess } from 'crinoid/main'

const config = createDesktopConfig({ appName: 'My App' })

createMainProcess({
  config,
  window: {
    preloadPath: join(__dirname, 'preload.js'),
    rendererFile: join(__dirname, '../renderer/main_window/index.html'),
    devServerUrl: process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL
  }
})
```

### Preload

```ts
// src/preload/index.ts
import { exposeDesktopApi } from 'crinoid/preload'

exposeDesktopApi()
```

### Renderer

```tsx
// src/renderer/main.tsx
import { DesktopProviders, AppShell } from 'crinoid/react'
import messages from './locales/en/common.json'

function App() {
  return <AppShell>Your application content</AppShell>
}

createRoot(document.getElementById('root')!).render(
  <DesktopProviders locale="en" messages={messages}>
    <App />
  </DesktopProviders>
)
```

### Typed renderer bridge

```ts
// src/vite-env.d.ts
import type { DesktopAPI } from 'crinoid/ipc'

declare global {
  interface Window {
    desktop: DesktopAPI
  }
}
```

### Forge and Vite configuration

```ts
// forge.config.ts
import { createForgeConfig } from 'crinoid/forge'

export default createForgeConfig({
  packagerConfig: { executableName: 'my-app' },
  makers: [],
  plugins: []
})
```

```ts
// vite.main.config.mts
import { createMainViteConfig } from 'crinoid/vite'

export default createMainViteConfig('src/main/index.ts')
```

## Foundational features

`createMainProcess` already wires environments, lifecycle, graceful shutdown, global error handling, global logging, typed IPC, and a window registry. Use the exported pieces directly when you need finer control.

### Environment

`resolveEnvironment` maps `NODE_ENV` and `app.isPackaged` onto `development`, `test`, or `production`; unknown `NODE_ENV` values fall back to the packaging state. `createMainProcess` uses the resolved environment to pick a default log level.

```ts
import { environmentFromProcess } from 'crinoid/environment'

const environment = environmentFromProcess(process.env, app.isPackaged)
```

### Global logging

```ts
import { createLogger, createRotatingFileSink, levelFromEnvironment } from 'crinoid/logging'

const logger = createLogger({
  level: levelFromEnvironment(environment.name),
  sink: createRotatingFileSink({ filePath: join(app.getPath('logs'), 'app.log') })
})

logger.info('started', { version: app.getVersion() })
await logger.flush()
```

### Graceful shutdown

Register cleanup tasks; they run concurrently with a per-task timeout when the app quits.

```ts
createMainProcess({
  config,
  window: { /* ... */ },
  onShutdown: async () => {
    await database.close()
  }
})
```

For manual composition, `createAppLifecycle` wires `ready` / `activate` / `window-all-closed` / `before-quit` and exposes the shutdown manager.

```ts
import { createAppLifecycle, createShutdownManager } from 'crinoid/lifecycle'

const shutdown = createShutdownManager({ logger })
const lifecycle = createAppLifecycle({ app, onReady: init, shutdown })
lifecycle.shutdown.register({ name: 'database', run: () => database.close() })
```

### Global error handling

```ts
import { installGlobalErrorHandlers } from 'crinoid/errors'

installGlobalErrorHandlers({ source: process, logger, onError: reportToBackend })
```

In the renderer, wrap the tree with `ErrorBoundary`:

```tsx
import { ErrorBoundary } from 'crinoid/react'

<ErrorBoundary fallback={(error) => <p>{error.message}</p>}>{children}</ErrorBoundary>
```

### Typed IPC

Define a channel once and register a validated handler. The registry rejects untrusted senders and invalid payloads, and returns a disposer.

```ts
import { createChannel, createIpcRegistry } from 'crinoid/ipc'

const increment = createChannel<{ by: number }, number>(
  'counter.increment',
  (value): value is { by: number } => typeof (value as { by?: unknown })?.by === 'number'
)

const registry = createIpcRegistry(ipcMain, { origin: 'file:', logger })
const dispose = registry.register({ channel: increment, handle: ({ request }) => counter += request.by })
```

### Multiple windows

```ts
import { createWindowRegistry } from 'crinoid/window'

const windows = createWindowRegistry<BrowserWindow>()
windows.open('settings', () => new BrowserWindow({ /* ... */ }))
windows.broadcast('theme.changed', 'dark')
```

`createMainProcess` can open extra windows and named child windows directly:

```ts
createMainProcess({
  config,
  window: mainWindowOptions,          // main window
  windows: [settingsWindowOptions],   // extra top-level windows
  childWindows: { about: aboutOptions }
})
```

The renderer opens a child window with `await window.desktop.window.open('about')`.

### Window and interface

Declare tray, menus, global shortcuts, and custom chrome through the same options object.

```ts
createMainProcess({
  config,
  window: {
    /* ... */
    chrome: { titleBarStyle: 'hiddenInset', alwaysOnTop: true, minWidth: 900 }
  },
  menuTemplate: [{ role: 'fileMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }],
  shortcuts: { CommandOrControl+Shift+I: () => openDevTools() },
  tray: {
    iconPath: join(__dirname, 'tray.png'),
    tooltip: 'My App',
    labels: { show: 'Show', quit: 'Quit' },
    minimizeToTray: true,
    closeToTray: true
  }
})
```

Dialogs, context menus, and native integration are reachable from the renderer bridge:

```ts
await window.desktop.dialog.openDirectory()
await window.desktop.dialog.confirm({ message: 'Delete?', confirmLabel: 'Delete', cancelLabel: 'Keep' })
await window.desktop.contextMenu.show({ items: [{ id: 'copy', label: 'Copy' }], x, y })
window.desktop.app.setBadge(3)
window.desktop.window.setAlwaysOnTop(true)
```

Compose the pieces directly when you need finer control:

```ts
import { createTrayController } from 'crinoid/tray'
import { createShortcutManager } from 'crinoid/shortcuts'
import { createDialogService } from 'crinoid/dialogs'
import { createPlatformIntegration } from 'crinoid/integration'
```

### Application state

```ts
import { createStore } from 'crinoid/reactive'
import { createPersistentStore } from 'crinoid/persistent'
import { createRecentItems } from 'crinoid/recent-items'

const store = createStore({ theme: 'light' })
store.subscribe((value) => console.log(value))
const theme = store.select((state) => state.theme)

const preferences = await createPersistentStore({ storage, key: 'prefs', defaults: { theme: 'light' } })
const recent = createRecentItems({ limit: 10 })
```

`createMainProcess` wires a cross-window synced store and recent-files list when you pass `state` / `recentFiles`:

```ts
createMainProcess({
  config,
  window,
  state: { initial: { theme: 'light' }, persistPath: join(app.getPath('userData'), 'state.json') },
  recentFiles: { limit: 10 }
})
```

The renderer uses `window.desktop.store`, `window.desktop.preferences`, and `window.desktop.recentFiles`.

### File system

```ts
import { readText, writeText, listDirectory, copyPath } from 'crinoid/fs'
import { detectMimeType } from 'crinoid/mime'
import { watchPath } from 'crinoid/watch'

await writeText('/tmp/note.txt', 'hello')
await readText('/tmp/note.txt')
await listDirectory('/tmp')
detectMimeType('/tmp/note.txt')
const watcher = watchPath('/tmp', (event) => console.log(event))
```

The renderer reaches the same operations through `window.desktop.fs` (pick, read, write, list, copy, move, remove, mime) and `window.desktop.recentFiles`.

### Networking

```ts
import { createApiClient } from 'crinoid/api'
import { createWebSocketClient } from 'crinoid/websocket'
import { createSseClient } from 'crinoid/sse'
import { createTransferManager } from 'crinoid/transfers'
import { applyProxy } from 'crinoid/proxy'

const api = createApiClient('https://api.example.com', fetch, {
  timeoutMs: 15_000,
  retries: 3,
  isOnline: () => navigator.onLine
})

const socket = createWebSocketClient('wss://api.example.com/socket', { onMessage: (data) => console.log(data) })
const stream = createSseClient('https://api.example.com/events', { onEvent: (_name, data) => console.log(data) })
```

`createMainProcess` accepts a `proxy` option and wires a download manager for the renderer:

```ts
createMainProcess({
  config,
  window,
  proxy: { mode: 'fixed', url: 'http://proxy.internal:8080' }
})
```

```ts
// renderer
window.desktop.transfers.onProgress((progress) => console.log(progress))
await window.desktop.transfers.download('https://example.com/file.bin')
```

### Authentication and local data

```ts
import { createSessionManager, createTokenManager } from 'crinoid/auth'
import { createSqliteDriver } from 'crinoid/sqlite'
import { createDatabase } from 'crinoid/database'
import { createKeyValueStorage, createMemoryStorage } from 'crinoid/storage'

const session = createSessionManager<{ id: string }>({ storage: sessionStorage, authenticate: login })
const tokens = createTokenManager({ provider: { refresh } })

const database = await createDatabase({
  driver: createSqliteDriver({ file: join(app.getPath('userData'), 'app.db') }),
  migrations: [{ id: '001-init', up: 'CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT)' }]
})

const kv = createKeyValueStorage(createMemoryStorage(), 'settings')
```

`createMainProcess` accepts an `auth` bridge to register auth IPC and restore the session on startup:

```ts
createMainProcess({
  config,
  window,
  auth: { sessionManager: session, tokens }
})
```

```ts
// renderer
await window.desktop.auth.login({ username, password })
window.desktop.auth.onChanged((session) => console.log(session))
```

### Task system and updates

```ts
import { createJobQueue, createScheduler, createUpdateService, resolveChannel } from 'crinoid/tasks'

const queue = createJobQueue({ concurrency: 4 })
await queue.add((signal) => longRunning(signal), { retries: 3, onStart: () => console.log('started') })

const scheduler = createScheduler()
scheduler.schedule('cleanup', { cron: '0 3 * * *' }, () => cleanup())

const updates = createUpdateService({
  adapter: electronUpdaterAdapter,
  currentVersion: app.getVersion(),
  channel: resolveChannel('beta')
})
```

The renderer drives updates through `window.desktop.updates` (check/download/install/rollback/channel/progress).

### System capabilities

```ts
const info = await window.desktop.system.info()
const battery = await window.desktop.power.status()
const online = await window.desktop.network.status()
await window.desktop.notifications.show({ title: 'Done', body: 'Export finished' })
await window.desktop.clipboard.writeText('copied')
await window.desktop.shell.showItemInFolder('/tmp/report.pdf')
```

Compose the pieces directly in the main process:

```ts
import { createClipboardService } from 'crinoid/clipboard'
import { createNotificationService } from 'crinoid/notifications'
import { createShellService } from 'crinoid/shell'
import { collectSystemInfo } from 'crinoid/system'
import { createPowerMonitor } from 'crinoid/power'
import { createNetworkMonitor } from 'crinoid/network'
import { createSecretStore } from 'crinoid/secrets'
```

### Security

`createMainProcess` installs a restrictive Content Security Policy and keeps every window isolated (`contextIsolation`, `sandbox`, no Node in the renderer). Secrets are encrypted with the OS keychain:

```ts
import { buildContentSecurityPolicy } from 'crinoid/security'
import { createSecretStore } from 'crinoid/secrets'

const policy = buildContentSecurityPolicy({ apiOrigins: ['https://api.example.com'] })
// renderer: await window.desktop.secrets.set('token', value)
```

## Updating

```bash
pnpm update crinoid
```

Major releases document API and configuration changes in `CHANGELOG.md`. Consumer source files are never modified automatically.
