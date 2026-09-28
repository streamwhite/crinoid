# Crinoid

Secure Electron + React + Vite + TypeScript infrastructure published as a normal package.

## Coding agent skill

Coding agents can install a skill covering the whole framework (main process, preload bridge, typed IPC,
and every desktop capability) with:

```bash
npx skills add streamwhite/desktop-dev-template-electron -g
```

The skill lives in `.agents/skills/framework-development/` and is discovered by `npx skills` as well as by
agents that read `.agents/skills/` directly.

## Consume as a package

The Electron infrastructure is published as `crinoid` and consumed like React or Vite:

```bash
pnpm add crinoid
```

New projects import infrastructure from the package instead of copying it. See `packages/crinoid/README.md` for the consumer contract and `examples/reference-app` for a complete working consumer.

```bash
pnpm update crinoid
```

Updates reach existing consumers through normal package management. The package never modifies consumer source files.

## Scaffold

The optional initializer creates thin process entrypoints that depend on the package:

```bash
node packages/create-crinoid/src/cli.mjs my-app
```

## Repository layout

- `packages/crinoid` — the published runtime package (main, preload, renderer, and native infrastructure).
- `packages/create-crinoid` — optional initializer and its thin project template.
- `examples/reference-app` — package consumer used by the typechecks.
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

Run the reference consumer locally with `pnpm --filter reference-app dev`, or build its packaged app with `pnpm --filter reference-app package` (output in `examples/reference-app/out`; run on the target platform).

## Release

Package versioning and publishing are tool-driven:

```bash
pnpm release:packages           # bump patch, sync versions, promote CHANGELOG, verify, commit, tag pkg-vX.Y.Z, push
pnpm release:packages minor     # or minor / major / an explicit version
pnpm release:packages patch --dry-run   # preview every file change first
```

`scripts/release-packages.mjs` keeps both published packages (`crinoid` and
`create-crinoid`) in lockstep, updates the scaffold template's dependency range, promotes the
`## Unreleased` CHANGELOG section to the new version, runs the typechecks and tests, then commits and
pushes the `pkg-vX.Y.Z` tag. Pushing the tag triggers `.github/workflows/publish-packages.yml`, which
runs `scripts/publish-packages.mjs` to publish only versions that are not already on the registry.

Publishing targets the private registry `https://registry.piaosiyuan.cn/js/` configured in `.npmrc`
(and each package's `publishConfig.registry`). CI passes it through to `scripts/publish-packages.mjs`
on the `pkg-vX.Y.Z` tag. To publish manually against a different npm-compatible registry:

```bash
node scripts/publish-packages.mjs --registry https://npm.corp.internal/
```

Private workspace packages are skipped automatically. Add the matching `CHANGELOG.md` entry (under
`## Unreleased`) before running the release script.
