# Crinoid

Crinoid is a secure Electron + React + Vite + TypeScript desktop framework, published as the `crinoid`
npm package. A project depends on it and writes business features only: reusable desktop infrastructure
stays in the package, updates through normal dependency management, and never rewrites consumer source.

```bash
pnpm add crinoid
```

One `createMainProcess` call wires environment detection, lifecycle, graceful shutdown, global error
handling, structured logging, typed IPC with sender validation, a restrictive CSP, and the window registry.
Everything it wires is also exported for manual composition.

## Quick start

### New app

```bash
pnpm dlx create-crinoid my-app
cd my-app
pnpm install
pnpm dev
```

`create-crinoid` writes a thin scaffold: main and preload entry points delegate to the package, and the
renderer is a plain React app with locales and a `src/features/` folder for business code.

### Existing app

```bash
pnpm add crinoid
pnpm add react react-dom electron
```

`electron`, `react`, and `react-dom` are peer dependencies. The three entry points are small:

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
import { createRoot } from 'react-dom/client'
import { AppShell, DesktopProviders, ErrorBoundary } from 'crinoid/react'
import messages from './locales/en/common.json'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallback={(error) => <p role="alert">{error.message}</p>}>
    <DesktopProviders locale="en" messages={messages}>
      <AppShell>Your application</AppShell>
    </DesktopProviders>
  </ErrorBoundary>
)
```

The renderer reaches the operating system only through the typed `window.desktop` bridge. Import the
`DesktopAPI` type from `crinoid/ipc` into `vite-env.d.ts` to type it globally.

## Coding agent skills

Crinoid ships focused agent skills, split by functional module so agents load only what a task needs:

```bash
npx skills add streamwhite/desktop-dev-template-electron -g
```

| Skill | Scope |
| --- | --- |
| [`crinoid-setup`](.agents/skills/crinoid-setup/SKILL.md) | scaffold, entry files, Forge/Vite, build and release |
| [`crinoid-main-process`](.agents/skills/crinoid-main-process/SKILL.md) | `createMainProcess`, windows, tray, menus, shortcuts, lifecycle |
| [`crinoid-renderer`](.agents/skills/crinoid-renderer/SKILL.md) | preload bridge, `window.desktop`, typed IPC, React, i18n |
| [`crinoid-data`](.agents/skills/crinoid-data/SKILL.md) | state, preferences, files, storage, SQLite, import/export |
| [`crinoid-services`](.agents/skills/crinoid-services/SKILL.md) | HTTP, WebSocket, SSE, auth, tasks, updates |
| [`crinoid-system`](.agents/skills/crinoid-system/SKILL.md) | clipboard, shell, power, secrets, security, observability |
| [`crinoid-app-features`](.agents/skills/crinoid-app-features/SKILL.md) | settings, about, help, keybindings, command palette, search, history |
| [`crinoid-testing`](.agents/skills/crinoid-testing/SKILL.md) | unit/component/IPC/main/E2E testing and test policy |

Each skill is discovered by `npx skills` as well as agents that read `.agents/skills/` directly. The
`crinoid-setup` skill includes a routing table to the other modules.

## What is included

`createMainProcess` already wires most of these. Import a subpath directly when you need finer control.
See [`packages/crinoid/API.md`](packages/crinoid/API.md) for the complete public API.

### Process foundation

| Import | Provides |
| --- | --- |
| `crinoid/main` | `createMainProcess`, window and child-window creation, single-instance acquisition |
| `crinoid/config` | `createDesktopConfig`, feature flags for tray, auto-update, deep links, and command palette |
| `crinoid/environment` | `development` / `test` / `production` detection from `NODE_ENV` and packaging state |
| `crinoid/lifecycle` | `ready` / `activate` / `window-all-closed` / `before-quit`, concurrent graceful shutdown with timeouts |
| `crinoid/errors` | global `uncaughtException` / `unhandledRejection` handlers and error normalization |
| `crinoid/logging` | leveled structured logger with console, multi-sink, and rotating-file sinks |
| `crinoid/ipc` | typed channels, registry with sender/payload validation, invoker, `DesktopAPI` |
| `crinoid/window` | window registry, bounds persistence, visibility checks across displays |

### Windows and native interface

Dialogs (open/save/directory/confirm), tray with minimize/close-to-tray, role-based menus, native context
menus, global shortcuts, custom title bars, fullscreen and always-on-top, plus Dock/Taskbar badges,
attention, progress, and flashing. Available from `crinoid/dialogs`, `crinoid/tray`, `crinoid/menu`,
`crinoid/context-menu`, `crinoid/shortcuts`, and `crinoid/integration`.

### State and persistence

`createStore` with typed get/set/update/subscribe and derived selectors, persistent stores, cross-window
state sync, user preferences, and recent-items lists (`crinoid/reactive`, `crinoid/persistent`,
`crinoid/state-sync`, `crinoid/preferences`, `crinoid/recent-items`).

### Files and streaming

Read/write text and JSON, list/copy/move/remove/exists/ensure-directory, chunked streaming with progress,
debounced path watching, path helpers, and MIME detection (`crinoid/fs`, `crinoid/stream`, `crinoid/watch`,
`crinoid/paths`, `crinoid/mime`). Native pickers and the same operations are exposed as `window.desktop.fs`.

### Networking

`createApiClient` with retries, backoff, timeouts, abort, and offline short-circuiting; WebSocket and SSE
clients with reconnect handling; a download/upload manager with progress and cancellation; and system,
direct, fixed, or PAC proxy configuration (`crinoid/api`, `crinoid/websocket`, `crinoid/sse`,
`crinoid/transfers`, `crinoid/proxy`).

### Auth and local data

Session and token managers, OAuth with PKCE, deep-link routing, SQLite via `node:sqlite`, versioned database
migrations and repositories, TTL caches, key-value storage, IndexedDB, and versioned data export/import
backup and restore (`crinoid/auth`, `crinoid/deep-link`, `crinoid/sqlite`, `crinoid/database`,
`crinoid/cache`, `crinoid/storage`, `crinoid/indexeddb`, `crinoid/data-transfer`).

### Tasks, updates, and observability

Task context with progress and cancellation, concurrency-limited job queues, interval/cron schedulers,
worker pools, auto-update check/download/install/rollback with release channels, crash reporting with
secret scrubbing, metrics, tracing, and feedback reports (`crinoid/tasks`, `crinoid/crash-reporting`,
`crinoid/metrics`, `crinoid/trace`, `crinoid/feedback`, `crinoid/observability`).

### System, security, and common capabilities

Clipboard (text and PNG images), native notifications, allowlisted shell operations, system info, battery
and power events, connectivity status, OS-keychain secrets, and auto-launch. Security primitives include CSP
construction, external-URL and permission allowlists, and sender validation (`crinoid/clipboard`,
`crinoid/notifications`, `crinoid/shell`, `crinoid/system`, `crinoid/power`, `crinoid/network`,
`crinoid/secrets`, `crinoid/auto-launch`, `crinoid/security`).

Internationalization uses `react-intl` through `DesktopProviders`, with locale detection, RTL direction, and
date/number/currency formatters (`crinoid/i18n`, `crinoid/react`). Versioned settings, About info, help
links, in-app keybindings, command palette with fuzzy search, favorites, undo/redo history, and
drag-and-drop are in `crinoid/settings`, `crinoid/about`, `crinoid/help`, `crinoid/keybindings`,
`crinoid/command-palette`, `crinoid/search`, `crinoid/favorites`, `crinoid/history`, and `crinoid/drag-drop`.

### Testing

Unit fixtures, a fake IPC pair that enforces production trust and payload rules, an Electron mock, a
collecting logger, React `TestProviders`, a `window.desktop` stub, and structural E2E helpers
(`crinoid/testing`, `crinoid/testing/react`, `crinoid/testing/e2e`).

```ts
import { createTempDir, waitFor } from 'crinoid/testing'
import { createDesktopApiStub, installDesktopBridge } from 'crinoid/testing/react'
```

## Security model

- Renderer code has no access to Electron or Node.js; preload exposes only named capabilities.
- Every window uses `contextIsolation: true`, `sandbox: true`, and `nodeIntegration: false`.
- IPC channels are explicit capabilities — there is no generic `invoke()`.
- IPC handlers validate sender origin and payload types.
- Content Security Policy is restrictive and installed by default.
- External URLs are limited to `https:` and `mailto:`; permission requests default to deny.
- Secrets use OS-backed encryption (`safeStorage` / Keychain / Credential Manager).
- Forge fuses disable RunAsNode, Node options, and CLI inspect arguments.

## Documentation

- [`packages/crinoid/README.md`](packages/crinoid/README.md) — copy-paste usage for every feature.
- [`packages/crinoid/API.md`](packages/crinoid/API.md) — full public API by entry point.
- [`packages/crinoid/CHANGELOG.md`](packages/crinoid/CHANGELOG.md) — released changes and migration notes.
- [`.agents/skills/`](.agents/skills/) — focused agent skills for setup, main process, renderer, data, services, system, app features, and testing.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/TESTING-PLAN.md`](docs/TESTING-PLAN.md), and
  [`docs/SECURITY.md`](docs/SECURITY.md) — design and policy notes.

## Repository layout

- `packages/crinoid` — published runtime package (main, preload, renderer, and native infrastructure).
- `packages/create-crinoid` — optional initializer and its thin project template.
- `examples/reference-app` — package consumer used by the typechecks and packaging CI.
- `tests` — package unit, component, and IPC contract tests.

## Development

```bash
PNPM_CONFIG_BLOCK_EXOTIC_SUBDEPS=false pnpm install
pnpm test
pnpm typecheck
pnpm typecheck:package
pnpm typecheck:reference
pnpm format:check
```

Run the reference consumer with `pnpm --filter reference-app dev`, or build its packaged app with
`pnpm --filter reference-app package` (output in `examples/reference-app/out`; run on the target platform).

## Release

Both published packages are versioned and released in lockstep:

```bash
pnpm release:packages                    # bump patch, verify, commit, tag pkg-vX.Y.Z, push
pnpm release:packages minor              # or major / an explicit version
pnpm release:packages patch --dry-run    # preview every file change first
```

`scripts/release-packages.mjs` updates both package versions, the scaffold template's dependency range,
and the `## Unreleased` CHANGELOG section, runs the typechecks and tests, then commits and pushes the
`pkg-vX.Y.Z` tag. The tag triggers `.github/workflows/publish-packages.yml`, which publishes every
non-private package whose version is not yet on the registry.

Publishing targets <https://registry.npmjs.org/>. CI reads the `NPM_TOKEN` repository secret. To publish
manually against a different npm-compatible registry:

```bash
node scripts/publish-packages.mjs --registry https://npm.corp.internal/
```

Add the matching `CHANGELOG.md` entry under `## Unreleased` before running the release script.

## License

[Apache-2.0](LICENSE). Copyright 2026 Template Maintainers.
