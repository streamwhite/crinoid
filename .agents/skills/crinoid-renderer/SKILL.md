---
name: crinoid-renderer
description: Build the preload bridge and React renderer for a crinoid desktop app. Use when working with exposeDesktopApi, the typed window.desktop API, custom typed IPC channels, DesktopProviders/AppShell, ErrorBoundary, keyboard shortcuts, i18n/RTL, or renderer-side drag and drop. Triggers on window.desktop, DesktopAPI, preload, contextBridge, ipcRenderer.invoke, react-intl, DesktopProviders, AppShell, useKeyboardShortcuts.
---

# Crinoid renderer and preload bridge

The renderer is a normal React app with one privileged surface: `window.desktop`. It must not import
`electron` or `node:*`.

## Preload stays thin

```ts
// src/preload/index.ts
import { exposeDesktopApi } from 'crinoid/preload'

exposeDesktopApi()
```

Never expose raw `ipcRenderer`, `require`, or a generic `invoke`/`send` channel. Every capability is a
named method on `DesktopAPI` from `crinoid/ipc`.

## Typed renderer bridge

```ts
// src/renderer/vite-env.d.ts
import type { DesktopAPI } from 'crinoid/ipc'
declare global {
  interface Window {
    desktop: DesktopAPI
  }
}
export {}
```

| Namespace | Methods |
| --- | --- |
| `app` | `getVersion`, `getLocale`, `setBadge`, `requestAttention`, `setProgress`, `flash`, `onDeepLink` |
| `window` | `minimize`, `maximize`, `close`, `toggleFullScreen`, `setAlwaysOnTop`, `open(id)` |
| `dialog` | `openFile(options?)`, `openFiles(options?)`, `openDirectory(options?)`, `saveFile(options?)`, `confirm` |
| `fs` | `pickFile`, `pickDirectory`, `readText`, `writeText`, `readJson`, `writeJson`, `list`, `exists`, `ensureDir`, `copy`, `move`, `remove`, `mime`, `watch`, `pathForFile` |
| `shell` | `openExternal`, `openPath`, `showItemInFolder`, `trashItem` |
| `contextMenu` | `show` |
| `clipboard` | `readText`, `writeText`, `readHtml`, `writeHtml`, `readImage`, `writeImage`, `hasImage`, `hasHtml`, `clear` |
| `notifications` | `show` |
| `system` / `power` / `network` | `info()`, `status()`, `onSuspend`/`onResume`/`onLock`/`onUnlock`/`onChange` |
| `secrets` | `get`, `set`, `has`, `remove` |
| `auth` | `login`, `logout`, `session`, `tokens`, `onChanged` |
| `updates` | `check`, `download`, `install`, `rollback`, `setChannel`, `onProgress` |
| `transfers` | `download`, `cancelAll`, `onProgress` |
| `store` / `preferences` / `recentFiles` | `get`/`set`/`onChange`, `get`/`set`/`all`, `add`/`list`/`remove`/`clear` |
| `feedback` / `crash` | `submit`, `report` |

## Custom typed IPC

Define the channel once and register a validated handler in the main process:

```ts
// shared contract
import { createChannel } from 'crinoid/ipc'

export const increment = createChannel<{ by: number }, number>(
  'counter.increment',
  (value): value is { by: number } => typeof (value as { by?: unknown })?.by === 'number'
)
```

```ts
// main
const registry = createIpcRegistry(ipcMain, { origin: 'file:', logger })
registry.register({ channel: increment, handle: ({ request }) => count += request.by })
```

```ts
// preload
const incrementCounter = createIpcInvoker(increment, ipcRenderer)
contextBridge.exposeInMainWorld('counter', { increment: incrementCounter })
```

The registry rejects untrusted senders and invalid payloads before the handler runs.

## React entry

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell, DesktopProviders, ErrorBoundary } from 'crinoid/react'

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

`crinoid/react` also exports `LocaleProvider`, `ThemeProvider`, `useKeyboardShortcuts`, and generic
loading/empty/error states. For Tailwind-based primitives, blocks, and charts, use the `crinoid-ui` skill. `ErrorBoundary` forwards renderer errors to `onError`; send them to the main
process with `desktop.crash.report({ message, stack, context })`.

## Internationalization

- Use `react-intl` through `DesktopProviders` / `LocaleProvider`.
- Put every user-facing string in the feature's locale JSON; never hard-code UI text.
- `detectLocale`, `resolveLocale`, `directionForLocale`, and `createFormatters` come from `crinoid/i18n`.
- Switch locales with `useLocale().setLocale(locale)`; read the OS locale with `desktop.app.getLocale()`.
- `LocaleProvider` sets the document `dir` and `lang` attributes for RTL locales.

## Keyboard shortcuts and drag and drop

- In-app bindings: `parseKeybinding` / `matchesKeybinding` / `createKeybindingRegistry` and the
  `useKeyboardShortcuts` hook.
- Global accelerators are a main-process concern (`createShortcutManager`); see `crinoid-main-process`.
- Dropped files: `readDroppedItems` / `readDroppedText` / `createDropController` from `crinoid/drag-drop`.
  Resolve OS paths with `desktop.fs.pathForFile(file)`; `File.path` is unavailable in modern Electron.

```ts
const drop = createDropController()
drop.onDrop(event, (items) => {
  for (const item of items) handle(item)
})
```

## Rules

- Renderer imports only `crinoid/*` subpaths, React, and browser-safe libraries.
- Keep `DesktopAPI` as the only OS access path; no `ipcRenderer` in renderer code.
- Do not add a generic IPC passthrough to work around a missing capability. Add an explicit channel instead.
- Keep business code under `src/features/<feature>/`; do not place it in infrastructure modules.

## Authoritative references

`node_modules/crinoid/API.md` (ipc, preload, react, i18n) and `node_modules/crinoid/README.md`.
