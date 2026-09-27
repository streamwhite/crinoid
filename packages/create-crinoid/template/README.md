# Electron App

This project was created with `create-crinoid`. It depends on `crinoid` for all Electron infrastructure.

## Development

```bash
pnpm install
pnpm dev
```

## Project layout

- `src/main/index.ts` — starts the main process from the package.
- `src/preload/index.ts` — exposes the typed desktop bridge.
- `src/renderer/main.tsx` — renders the React UI.
- `src/features/` — add business features here.

## Updating infrastructure

```bash
pnpm update crinoid
```
