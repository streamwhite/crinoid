# Package Distribution Mode A

> **Distribution decision (2026-09):** `crinoid` is the single published
> runtime package and is self-contained. The former low-level packages (`electron-core`, `electron-ipc`,
> `electron-config`, `electron-storage`, `electron-window`) were duplicates of code already inside the
> umbrella, so the two primitives that only existed there (`createModuleRuntime`, `createChannel`) were
> folded into the umbrella and the five packages were deleted — no private, invisible packages remain.
> `electron`, `react`, `react-dom` are peerDependencies of the umbrella, so consumers install and update
> one package (`pnpm update crinoid`) and its runtime dependencies ship with it.

## Goal

Make the Electron infrastructure consumable as a normal package:

```bash
pnpm add crinoid
```

New and existing projects must import infrastructure from the package. The project must not copy or overwrite infrastructure files after initialization.

Placeholder UI and example business content are not part of the package.

## Target Architecture

```text
crinoid/
├── packages/crinoid/   # the published package (all runtime infrastructure)
├── packages/create-crinoid/         # optional initializer
└── examples/reference-app/               # package consumer used by tests
```

One published runtime package. Every capability it offers must be reachable through its `exports`
map — nothing may live in an unexported file or an unpublished sibling package.

## Consumer Contract

The generated or manually created application owns only business code and thin process entrypoints.

```text
consumer project
├── src/main/index.ts       # imports package main factory
├── src/preload/index.ts    # imports package preload bridge
├── src/renderer/main.tsx   # imports package React providers/shell
├── src/features/           # project-owned
└── package.json             # depends on the public package
```

Example dependency:

```json
{
  "dependencies": {
    "crinoid": "^1.0.0"
  }
}
```

No package `postinstall` script may modify consumer source files.

## Public Exports

The facade package must expose stable entrypoints:

```text
crinoid
crinoid/main
crinoid/preload
crinoid/react
crinoid/ipc
crinoid/storage
crinoid/config
crinoid/forge
crinoid/vite
crinoid/types
```

Main and preload exports must not expose unrestricted Electron or Node APIs. React exports must contain infrastructure only, not product pages or demo content.

## Runtime API

Provide small factories instead of forcing consumers to copy implementation files:

```ts
createMainProcess(options)
createDesktopWindow(options)
registerDesktopIpc(options)
exposeDesktopApi(options)
createWindowManager(options)
createStorage(options)
createApiClient(options)
```

The API must support dependency injection for dialogs, clipboard, shell, updater, filesystem, and logging so consumer tests can replace native behavior.

## Configuration API

Configuration must be passed explicitly or loaded through a package helper:

```ts
createDesktopConfig({
  appName,
  defaultLocale,
  apiBaseUrl,
  features
})
```

The package must not read consumer business configuration implicitly from arbitrary files.

## Renderer API

Provide infrastructure providers without placeholder content:

```tsx
<DesktopProviders>
  <App />
</DesktopProviders>
```

The package may provide:

- theme provider
- query provider
- i18n provider factory
- accessibility-safe primitives
- loading/error/empty/offline state primitives
- AppShell primitives

It must not provide sample navigation, sample status cards, sample titles, or business routes.

## Forge and Vite Integration

Expose configuration helpers instead of requiring consumers to duplicate the repository configuration:

```ts
import { createForgeConfig } from 'crinoid/forge'
import { createMainViteConfig } from 'crinoid/vite'
```

Consumer projects retain control over:

- app name and bundle identifier
- makers and platform targets
- signing credentials
- publish provider
- renderer aliases
- business-specific build plugins

The package supplies secure defaults and allows explicit overrides.

## Update Behavior

Package publication does not silently change installed consumer projects. Updates happen through normal package management:

```bash
pnpm update crinoid
```

Use SemVer:

- patch: bug/security fixes without API changes
- minor: backward-compatible capabilities
- major: breaking API/configuration changes

Use Renovate or Dependabot to open update PRs for consumer projects.

## Upgrade Policy

All updates use normal package manager semantics. A consumer receives updates through:

```bash
pnpm update crinoid
```

Patch, minor, and major updates must not run migrations or modify consumer files automatically. For a major update, the package release must provide clear changelog and API documentation describing:

- removed or renamed exports
- changed function signatures
- changed configuration types
- changed peer dependency requirements
- required consumer code changes

The consumer developer is responsible for adapting their code. This keeps the package behavior consistent with normal npm packages such as React and Vite.

## Scaffold Role

`create-crinoid` becomes optional convenience tooling. It may create:

- package.json
- thin main/preload/renderer entrypoints
- TypeScript/Vite/Forge config that imports package helpers
- empty feature directories
- test configuration

It must not copy the runtime implementation into the consumer project.

## Versioning and Publishing

No release toolchain. Each package publishes with a plain publish command, exactly like any
npm library such as React:

```bash
cd packages/crinoid
pnpm version patch --tag-version-prefix pkg-v   # or edit "version" in package.json
pnpm publish --access public
```

For a private npm-compatible registry, point the publish at it (registry is never hardcoded):

```bash
pnpm publish --access public --registry https://npm.corp.internal/
```

CI does the same thing on a `pkg-v*.*.*` tag through
`.github/workflows/publish-packages.yml`, which publishes every non-private package with
`pnpm -r --filter './packages/*' publish`.

Release checklist: bump `version`, add the matching `CHANGELOG.md` entry, run `pnpm test` and
the typechecks, then publish. Private workspace packages (`electron-core`, `electron-ipc`,
`electron-config`, `electron-storage`, `electron-window`) are skipped automatically.

The public package must define `exports`, `files`, `types`, `peerDependencies`, and `engines` explicitly. Electron and React must not be duplicated accidentally in the consumer runtime.

## Testing Strategy

Add a reference consumer inside the workspace and validate:

- `pnpm add`/workspace dependency resolution
- main entry imports package API
- preload exposes only typed capabilities
- renderer providers render without placeholder UI
- package update preserves consumer feature files
- major-version upgrade documentation identifies required consumer changes
- Forge package and platform makers still work

The package itself must pass unit, component, IPC integration, and type tests.

## Acceptance Criteria

1. A clean consumer project can install the public package with `pnpm add`.
2. The consumer starts without copying Electron infrastructure source files.
3. There is no placeholder product UI in the package or reference consumer.
4. Updating the package version updates runtime infrastructure in an existing consumer.
5. Consumer business files remain owned by the consumer.
6. Breaking updates provide changelog and API documentation; consumer files are never modified automatically.
7. Forge packaging works from the reference consumer on supported runners.
8. CI publishes versioned packages and validates a clean consumer installation.

## Implementation Order

1. Create the public facade package and reference consumer.
2. Move main/preload/native infrastructure behind public factories and exports.
3. Remove placeholder UI and make renderer providers content-free.
4. Change the scaffold to generate only thin consumer entrypoints.
5. Add package exports, peer dependencies, and workspace package tests.
6. Add Changesets and package release CI.
7. Add release notes and API compatibility documentation for every version change.
8. Validate clean install, normal package update, packaging, and all existing tests.
