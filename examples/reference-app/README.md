# Reference App

A minimal consumer of `crinoid`.

This project owns only thin process entrypoints. All Electron infrastructure is imported from the package:

- `src/main/index.ts` — imports `createMainProcess` from `crinoid/main`
- `src/preload/index.ts` — imports `exposeDesktopApi` from `crinoid/preload`
- `src/renderer/main.tsx` — imports `DesktopProviders` and `AppShell` from `crinoid/react`
- `src/features/` — project-owned business code lives here

Add business features under `src/features/` without touching the package.
