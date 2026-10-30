---
name: crinoid-testing
description: Test crinoid desktop applications and the crinoid package itself. Use when writing unit, component, IPC, main-process, renderer, or E2E tests, mocking Electron, installing a desktop API stub, or deciding what belongs in the test suite. Triggers on crinoid/testing, createFakeIpcPair, createElectronMock, createMainDeps, TestProviders, createDesktopApiStub, installDesktopBridge, openFirstWindow, waitForWindow, pnpm test, pnpm typecheck.
---

# Crinoid testing

The package ships test utilities for every process boundary. Tests must not depend on real OS dialogs,
notifications, shell calls, or Electron windows.

## Commands

```bash
pnpm test          # vitest run tests/unit tests/component
pnpm test:watch    # vitest
pnpm typecheck     # tsc --noEmit
```

Run the smallest relevant test file while iterating, then the full suite and typecheck before handoff.

## Unit and fixture helpers

```ts
import { createDeferred, waitFor, createTempDir, withTempDir } from 'crinoid/testing'

const deferred = createDeferred<string>()
deferred.resolve('done')
await waitFor(() => condition, { timeoutMs: 1_000 })

const directory = await createTempDir()
await withTempDir(async (dir) => writeFixture(dir))
```

## IPC tests

```ts
import { createFakeIpcPair } from 'crinoid/testing'

const { ipcMain, ipcRenderer } = createFakeIpcPair()
const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
registry.register({ channel, handle: ({ request }) => request })

await ipcRenderer.invoke(channel.name, payload)
// pass { url: UNTRUSTED_RENDERER_URL } to test sender rejection
```

`createFakeIpcPair` enforces the same trust and payload rules as production. Use it to test a channel's
validation and sender policy, not just that a handler was called.

## Main-process tests

```ts
import { createCollectingLogger, createElectronMock, createMainDeps } from 'crinoid/testing'

const electron = createElectronMock()
const { logger, records } = createCollectingLogger()
const deps = createMainDeps({ logger })
```

- `createElectronMock` models `app`, `BrowserWindow`, dialogs, clipboard, shell, notifications, menus, tray,
  secret storage, IPC, shortcuts, screen, power monitor, and network status.
- `createCollectingLogger` records structured log records for assertions.
- `createMainDeps` builds injectable fakes for shell, dialogs, clipboard, tray, menus, shortcuts, taskbar,
  and Dock ports.

## Renderer tests

```tsx
import { TestProviders, createDesktopApiStub, installDesktopBridge } from 'crinoid/testing/react'

installDesktopBridge(createDesktopApiStub())

render(
  <TestProviders locale="en" messages={messages}>
    <Feature />
  </TestProviders>
)
```

`TestProviders` wraps `IntlProvider` and `ThemeProvider`. `createDesktopApiStub` returns a deep stub of
`DesktopAPI`; override only the methods a test exercises.

## E2E helpers

```ts
import { openFirstWindow, waitForWindowTitle, waitForWindow, closeApplication } from 'crinoid/testing/e2e'

const window = await openFirstWindow(app)
await waitForWindowTitle(window, 'My App')
await waitForWindow(app, (window) => Boolean(window))
await closeApplication(app)
```

The E2E helpers operate on structural application/window types and do not depend on Playwright. Use
Playwright only for critical flows that need a real Electron process.

## What to test

Test **this project's own logic**, not the libraries it wraps. Crinoid is the foundation for other apps, so
regressions are expensive; keep the suite focused but real.

- **Add tests** for composition/wiring (`createMainProcess`, `exposeDesktopApi` capability mapping),
  security policy, algorithms and parsers (path/MIME/version/keybinding/deep-link/migration), persistence
  formats and defaults, and the React components/contexts defined here.
- **Do not add tests** for thin passthroughs that only forward to a library or platform API (bare
  `node:path` re-exports, inline `electron` ports such as `shell.openPath`/`dialog.*`/`clipboard` reads,
  `node:os`/`process` reads). The dependency already covers them. A wrapper earns a test once it adds
  branching, validation, defaults, or policy.
- Avoid tests that only assert "a mocked library was called". Assert observable behavior instead.
- Fix the implementation when a test uncovers a real defect; do not weaken the test or change production
  code just to make a test simpler.

See `docs/TESTING-PLAN.md` for the full scope rule and current coverage.

## Rules

- Stub native dialogs, notifications, and shell calls; never depend on real OS UI in tests.
- Reset modules and mocks between Electron tests; `createElectronMock` state is process-local.
- Use `waitFor` for async lifecycle work instead of fixed sleeps.
- Keep test files under `tests/unit`, `tests/component`, or `tests/e2e` by concern.

## Authoritative references

`node_modules/crinoid/API.md` (testing utilities), `docs/TESTING-PLAN.md`, and the `tests/` directory.
