# Architecture

## Process boundary

The main process owns Electron and operating-system APIs. The preload script exposes the smallest typed capabilities required by the renderer. The renderer contains React UI only and must not import `electron` or Node.js modules.

The workspace packages separate scaffold generation (`create-crinoid`) from reusable runtime contracts (`electron-core`, `electron-ipc`, `electron-config`, `electron-storage`, and `electron-window`).

## Security

Windows use sandboxing, context isolation, disabled Node integration, CSP, navigation restrictions, sender validation, and allowlisted external protocols. IPC channels are explicit capabilities, not arbitrary command dispatch.

## State and storage

Server state belongs in the API client and TanStack Query. Temporary UI state stays in React. Non-sensitive preferences use file storage; credentials use Electron `safeStorage`.

## Testing and release

Vitest covers pure infrastructure, React Testing Library covers user-facing components, and Playwright is reserved for critical Electron workflows. Forge owns packaging, makers, fuses, signing configuration, and publishing.

## Distribution limits

macOS and Windows use the updater abstraction when a provider is configured. Linux updates are intentionally delegated to the package manager or distribution channel. Signing is enabled through CI secrets; no private certificate or token is stored in the repository.
