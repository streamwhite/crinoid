# Contributing

1. Keep renderer, preload, and main imports within their process boundaries.
2. Add a focused test before changing infrastructure behavior.
3. Put user-facing text in `src/renderer/locales`.
4. Run `pnpm test` and `pnpm typecheck` before opening a change.

Business features belong under `src/renderer/features` and should not be added to Electron infrastructure modules.
