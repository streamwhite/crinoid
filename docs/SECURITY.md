# Security Baseline

- Renderer code does not access Node.js or Electron directly.
- Preload exposes only named capabilities through `contextBridge`.
- Browser windows use `contextIsolation`, `sandbox`, and `nodeIntegration: false`.
- External links are limited to `https:` and `mailto:`.
- IPC handlers validate sender origin and argument types.
- Permission requests default to deny except for explicitly allowed capabilities.
- Secrets must not be stored in renderer storage; add OS-backed `safeStorage` integration before storing credentials.
- Remote plugin installation is not supported; plugins are trusted, compile-time extensions with declared capabilities.
- Electron fuses disable RunAsNode, Node options, CLI inspect arguments, and enable cookie encryption.
- Production signing and publishing require CI-provided certificates and tokens; local development has no signing secret.
