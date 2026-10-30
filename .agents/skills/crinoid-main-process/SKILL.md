---
name: crinoid-main-process
description: Compose the Electron main process with crinoid. Use when wiring createMainProcess, extra or child windows, window state/chrome, tray, native menus, context menus, global shortcuts, app lifecycle, graceful shutdown, single-instance locks, login-at-startup, deep links, or Dock/Taskbar integration. Triggers on createMainProcess, BrowserWindow, childWindows, Tray, Menu, globalShortcut, app lifecycle, before-quit, single instance, auto launch.
---

# Crinoid main process

`createMainProcess` wires the secure Electron main process and most platform infrastructure. Import the
individual modules directly only when you need finer control or a non-standard composition.

## Option map

All options are optional except `config` and `window`.

| Option | Wires |
| --- | --- |
| `config`, `window`, `windows[]`, `childWindows{}` | main window, extra top-level windows, named child windows (`desktop.window.open(id)`) |
| `menuTemplate`, `tray`, `shortcuts` | native menu, tray (minimize/close to tray), global accelerators |
| `state`, `preferences`, `recentFiles` | cross-window synced store, persisted user preferences, recent-files list |
| `auth` | auth IPC + session restore (`desktop.auth`) |
| `proxy` | system/direct/fixed/pac proxy |
| `updaterAdapter` / `updater`, `releaseChannel`, `onRollback` | auto-update (`desktop.updates`) |
| `observability` | logger, metrics, tracer, crash reporter, feedback |
| `autoLaunch` | login-at-startup |
| `environment`, `deps` | override environment detection / inject main deps for tests |
| `onShutdown`, `onError` | graceful cleanup, global error hook |

By default it installs environment detection, lifecycle, graceful shutdown, global error handling,
structured logging, typed IPC with sender validation, the restrictive CSP, and the window registry.

```ts
createMainProcess({
  config,
  window: { preloadPath, rendererFile, devServerUrl },
  windows: [settingsWindow],
  childWindows: { about: aboutWindow },
  tray: { iconPath, tooltip: 'My App', labels: { show: 'Show', quit: 'Quit' }, minimizeToTray: true },
  shortcuts: { 'CommandOrControl+Shift+I': () => openDevTools() },
  onShutdown: async () => database.close()
})
```

## Manual composition

The package exports every foundational piece:

| Import | Exports |
| --- | --- |
| `crinoid/config` | `createDesktopConfig`, `DEFAULT_FEATURES` |
| `crinoid/environment` | `resolveEnvironment`, `environmentFromProcess`, `readEnvValue` |
| `crinoid/lifecycle` | `createAppLifecycle`, `createShutdownManager`, `withTimeout` |
| `crinoid/errors` | `installGlobalErrorHandlers`, `normalizeError` |
| `crinoid/ipc` | `createChannel`, `createIpcRegistry`, `createIpcInvoker`, `DESKTOP_CHANNELS` |
| `crinoid/window` | `createWindowRegistry`, `ensureVisibleOnDisplays`, `loadWindowState`, `saveWindowState` |
| `crinoid/main` | `createMainProcess`, `createDesktopWindow`, `createChildWindow`, `acquireSingleInstance` |

Typed IPC is defined once and validated by the registry:

```ts
const increment = createChannel<{ by: number }, number>(
  'counter.increment',
  (v): v is { by: number } => typeof (v as { by?: unknown })?.by === 'number'
)
const registry = createIpcRegistry(ipcMain, { origin: 'file:', logger })
const dispose = registry.register({ channel: increment, handle: ({ request }) => count += request.by })
```

For renderer-side IPC patterns, use the `crinoid-renderer` skill.

## Windows and native interface

- **Main and child windows** — `window`, `windows[]`, and `childWindows{}`. Child windows are opened from
  the renderer with `desktop.window.open('about')`.
- **Window state** — `createDesktopWindow` restores size, position, maximized, and fullscreen state.
  `ensureVisibleOnDisplays` re-centers windows whose monitor disappeared.
- **Chrome** — `window.chrome` exposes frame, title bar style, overlay, transparency, min size, resizable,
  fullscreen, and always-on-top options.
- **Tray** — `createTrayController` builds the tray menu, wires click-to-show, and supports
  `minimizeToTray` / `closeToTray`.
- **Menus** — `createMenuService` installs a role-based application menu and pops up native context menus;
  `defaultApplicationMenuTemplate(isMacOS)` gives a label-free default.
- **Dialogs** — `createDialogService` wraps open-file, open-files, open-directory, save-file, and confirm.
  Renderer dialogs accept `title`, `defaultPath`, `buttonLabel`, and `filters`.
- **Shortcuts** — `createShortcutManager` registers and tracks global accelerators and releases them on dispose.
- **Dock / Taskbar** — `createPlatformIntegration` sets badges, requests attention, reports progress, and
  flashes the taskbar.

## Desktop-only features

- **Deep links** — `parseDeepLink` / `createDeepLinkRouter` route `myapp://route/id?query`;
  `findDeepLinkArgument` reads the launch command line. `createMainProcess` registers the protocol and
  forwards parsed `route` + `id` values to the renderer.
- **Login at startup** — `createAutoLaunch({ getLoginItemSettings, setLoginItemSettings }, options)`.
  `createMainProcess` applies `autoLaunch.enabled` on ready.
- **Single instance** — `createSingleInstance` acquires the lock, quits duplicates, and focuses the main
  window on a second launch.
- **Clipboard image** — handled by the system skill; see `crinoid-system`.

## Rules

- Never enable `nodeIntegration` or disable `contextIsolation` / `sandbox`.
- Keep navigation on the app origin; external URLs go through the allowlisted `shell` service.
- Register every IPC channel explicitly with the registry; never expose a generic invoke channel.
- Put shutdown cleanup in `onShutdown` or a registered shutdown task, not ad-hoc `before-quit` handlers.

## Authoritative references

`node_modules/crinoid/API.md` (window, interface, desktop capabilities) and `node_modules/crinoid/README.md`.
