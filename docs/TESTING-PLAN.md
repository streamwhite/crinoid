# Test plan

Crinoid is the foundation for new Electron projects, so its own implementation must be covered. This
document records the scope rule and the concrete gaps found, so future changes extend tests the same way.

## Scope rule

Add tests for **project-owned logic** - code in this repository that makes decisions:

- composition and wiring that the framework itself defines (`createMainProcess`, preload capability
  mapping, IPC registration rules);
- algorithms and policies (security policy, path/MIME/migration/repository logic, keybindings, deep-link
  parsing, version comparison, module runtime ordering, shutdown, state sync, cache, ...);
- persistence formats and defaults (storage/file, window state, settings envelopes);
- React components/contexts defined here (theme, locale, state views, error boundary).

Do **not** add tests for code that only forwards to a library or platform API and adds no logic of its
own. Those are already exercised by the dependency:

- trivial re-exports of `node:path` (`joinPath`, `normalizePath`, `basename`, `dirname`, `extension`,
  `relativePath`, `resolvePath`, `isAbsolutePath`);
- thin `electron` ports built inline (clipboard read/write passthrough, `shell.openPath`, `dialog.*`);
- `node:os` / `process` reads (`collectSystemInfo` fields, battery, `app.getVersion`).

If a wrapper gains branching, validation, defaults, or security policy, it becomes project logic and gets
tests. If a test would only assert that a mocked library was called, it is not worth adding.

## Baseline

- `pnpm test`: 74 files / 339 tests, all passing.
- `pnpm typecheck`: passing.
- The unit suite covers most capability modules; the gaps below are project logic that is currently
  untested or only smoke-tested.

## Gaps and planned coverage

| Module / area | Gap | Added test |
| --- | --- | --- |
| `config.ts` | `createDesktopConfig` only smoke-tested | defaults, locale/protocol trimming, feature-flag merge, HTTPS guard, blank `apiBaseUrl` |
| `module.ts` | `createModuleRuntime` untested | initialize in declaration order, capabilities forwarded, missing hooks skipped, dispose order |
| `storage/file.ts` | `createFileStorage` / `removeStorage` untested | round-trip across instances, nested directory creation, missing key, remove, keys, corrupt file fallback |
| `window.ts` | `loadWindowState` / `saveWindowState` untested | round-trip, missing file -> defaults, partial file merge, directory creation |
| `environment.ts` | `isAppEnvironment`, `readEnvValue`, `APP_ENVIRONMENTS` untested | membership guard, trim/blank handling |
| `deep-link.ts` | `isDeepLink`, `findDeepLinkArgument` untested | true/false/malformed, command-line scan |
| `network.ts` | `isBrowserOnline` untested, monitor dedupe untested | online flag, no emit when unchanged |
| `keybindings.ts` | `platformName`, aliases, `formatKeybinding` edge cases untested | key aliases, unknown modifiers, empty binding, capitalization |
| `database.ts` | `createRepository` CRUD + identifier validation untested | find/list/insert/update/remove, SQL-identifier injection guard |
| `tasks/version.ts` | `isPrerelease` untested | prerelease detection and build metadata tolerance |
| `react.tsx` | state views, `useTheme`, `ThemeProvider` persistence, `useDirection` untested | role attributes, theme storage + `data-theme`, provider guard errors, RTL direction |
| `main.ts` | `createDesktopWindow`, `createChildWindow`, `createMainProcess` wiring untested | security webPreferences, navigation/window-open policy, child window reuse, IPC registration + external-URL policy |
| `preload.ts` | `exposeDesktopApi` capability contract untested | exposes the fixed namespaces, routes to the right channels, subscribe/unsubscribe, `pathForFile` |

## Definition of done

1. New tests above are added under `tests/unit` (or `tests/component` for renderer).
2. `pnpm test` passes with the new tests.
3. `pnpm typecheck` still passes.
4. No production source is changed just to make a test simpler unless the change fixes a real defect.

## Status

Done - every gap in the plan is covered. `pnpm test` is at 80 files / 383 tests (from 74 / 339), and
`pnpm typecheck`, `pnpm typecheck:package`, and `pnpm typecheck:reference` all pass.

Adding the tests surfaced two real defects, both fixed in production code:

- `config.ts` validated `apiBaseUrl` before trimming, so a whitespace-only value threw `Invalid URL`
  instead of being treated as absent. Validation now runs on the trimmed value.
- `testing/electron.ts` `createElectronMock()`'s `BrowserWindow` was missing `once()`, which the project's
  own `createWindowRegistry` calls. Consumers could not test a main process built on the mock; it is now
  implemented (self-removing listener).

The Electron test double also gained an `emit()` on `MockWebContents` and a stored `windowOpenHandler`, so
window navigation and new-window policy can be asserted. `tests/unit/main-process.test.ts` therefore covers
the full `main.ts` plan row: secure web preferences, restored window state, parent-bound child windows,
origin-locked navigation, denied new windows with allowlisted external opens, desktop IPC registration,
the external-URL allowlist, optional auth channels, and named child-window reuse.

