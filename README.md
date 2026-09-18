# Electron Desktop Application Template

Secure Electron + React + Vite + TypeScript starter with an explicit main/preload/renderer boundary.

The workspace also contains reusable packages under `packages/` and the scaffold CLI:

```bash
pnpm --filter @your-scope/create-electron-app exec create-electron-app my-app
```

## Development

```bash
PNPM_CONFIG_BLOCK_EXOTIC_SUBDEPS=false pnpm install
pnpm dev
```

## Architecture

- `src/main`: trusted Electron and OS integration.
- `src/preload`: narrow capability bridge exposed as `window.desktop`.
- `src/renderer`: React UI with no direct Node.js or Electron imports.
- `src/shared`: process-safe contracts and types.

IPC handlers validate the sender and input. The default window enables context isolation and sandboxing, disables Node integration, and applies an external URL allowlist.

## Standard checks

```bash
pnpm test
pnpm typecheck
pnpm i18n:extract
pnpm i18n:verify
pnpm package
pnpm make
pnpm publish
```

`pnpm make` creates artifacts for the current runner only. Windows installers (`Setup.exe`) must be made on a Windows runner, macOS artifacts on macOS, and Linux artifacts on Linux. Use `pnpm make:windows`, `pnpm make:macos`, `pnpm make:linux`, `pnpm make:rpm`, or `pnpm make:appimage` on the corresponding platform. RPM generation requires `rpmbuild` on the Linux runner. On Ubuntu/Debian install it with `sudo apt-get install rpm`; Fedora/RHEL uses `sudo dnf install rpm-build`. AppImage generation requires `mksquashfs`; on Ubuntu/Debian install it with `sudo apt-get install squashfs-tools`. Both dedicated scripts check their prerequisite before invoking Forge. The CI workflow uploads each platform's `out/make` directory as an artifact.

`pnpm make` uses a content-addressed local cache in `.cache/electron-make`. It hashes source files, workspace packages, packaging configuration, lockfile, Node version, target arguments, and signing mode. On a cache hit Forge receives `--skip-package`, so the Vite/Electron package is reused while the installer is regenerated. Force a full rebuild with:

```bash
pnpm make -- --force
```
