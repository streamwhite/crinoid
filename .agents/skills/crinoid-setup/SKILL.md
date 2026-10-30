---
name: crinoid-setup
description: Create, scaffold, configure, build, package, or release a crinoid Electron + React + Vite + TypeScript desktop app. Use when starting a new crinoid project, adding the crinoid dependency, wiring the main/preload/renderer entry files, configuring Forge/Vite, or publishing installers. Triggers on create-crinoid, crinoid install, Electron desktop app setup, pnpm dev, pnpm package, pnpm make.
---

# Crinoid app setup

Crinoid is an opinionated Electron + React + Vite + TypeScript desktop framework shipped as the `crinoid`
package. A project depends on it and writes **business features only**; reusable desktop infrastructure
comes from the package.

Two rules come before everything else:

1. **Use the package, never copy it.** Add `crinoid`, import from its subpaths, and update with
   `pnpm update crinoid`.
2. **Respect the process boundary.** The renderer talks only to `window.desktop`; only the main process
   touches Electron and Node APIs.

## Install or scaffold

```bash
# new project (thin scaffold that depends on the package)
pnpm dlx create-crinoid my-app
cd my-app && pnpm install && pnpm dev

# existing project
pnpm add crinoid
pnpm add react react-dom electron        # peer dependencies
```

Published entry points: `crinoid`, `crinoid/main`, `crinoid/preload`, `crinoid/react`, one subpath per
capability, plus `crinoid/forge` and `crinoid/vite`.

## Three entry files

```ts
// src/main/index.ts
import { join } from 'node:path'
import { createDesktopConfig } from 'crinoid/config'
import { createMainProcess } from 'crinoid/main'

createMainProcess({
  config: createDesktopConfig({ appName: 'My App' }),
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
// src/renderer/vite-env.d.ts - typed bridge
import type { DesktopAPI } from 'crinoid/ipc'
declare global {
  interface Window {
    desktop: DesktopAPI
  }
}
export {}
```

## Build configuration

Use `create-crinoid` or `examples/reference-app` as copy-paste sources:

- `forge.config.ts` — `createForgeConfig` from `crinoid/forge` + `VitePlugin` + `FusesPlugin`.
- `vite.main.config.mts` — `createMainViteConfig`.
- `vite.preload.config.mts` — `createPreloadViteConfig`.
- `vite.config.mts` — `createRendererViteConfig`.

## Project layout

```
src/main/index.ts       start the main process from the package
src/preload/index.ts    expose the typed desktop bridge
src/renderer/           React UI (AppShell, locales/, features/)
src/features/<name>/    business features: components/ hooks/ api/ schemas/ types/
forge.config.ts  vite*.config.mts  tsconfig.json
```

Keep server state (API/query) separate from client UI state. Business code goes under
`src/features/<feature>/`; infrastructure stays outside features.

## Build, package, release

```bash
pnpm dev                 # electron-forge start
pnpm package             # electron-forge package (run on the target platform)
pnpm make                # installers / distributables
pnpm update crinoid      # pick up infrastructure updates
```

Versioning: patch fixes bugs, minor adds backward-compatible exports, major changes or removes APIs and
lists every required consumer change in `CHANGELOG.md`. Application source is never modified automatically.

## Next skill

| Task | Skill |
| --- | --- |
| Main process, windows, tray, menus, shortcuts, lifecycle | `crinoid-main-process` |
| Preload bridge, renderer API, React, i18n | `crinoid-renderer` |
| State, files, storage, SQLite, import/export | `crinoid-data` |
| HTTP, WebSocket, SSE, auth, tasks, updates | `crinoid-services` |
| Clipboard, shell, power, secrets, security, logging | `crinoid-system` |
| Settings, about, help, keybindings, command palette | `crinoid-app-features` |
| Tests, mocks, E2E helpers | `crinoid-testing` |

## Authoritative references

- `node_modules/crinoid/API.md` — public API by entry point and capability.
- `node_modules/crinoid/README.md` — copy-paste usage for every feature.
- `node_modules/crinoid/src/*.ts` — exact types and function signatures.

When in doubt, open the subpath source file and use its exported names as-is.
