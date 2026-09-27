# Contributing

1. Infrastructure lives in `packages/crinoid`; keep renderer, preload, and main imports within their process boundaries.
2. Add a focused test before changing infrastructure behavior.
3. Put user-facing text in the consumer's `src/renderer/locales` (see `examples/reference-app`).
4. Run `pnpm test`, `pnpm typecheck`, `pnpm typecheck:package`, and `pnpm typecheck:reference` before opening a change.

Business features belong in a consumer project under `src/features`; do not add product code to the package.
