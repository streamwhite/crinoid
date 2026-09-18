# Electron Desktop Application Template

## 1. Goal

Build a reusable, production-oriented Electron application template/package system that dramatically reduces the setup cost of future desktop projects.

A new project should start with:

```text
Electron
+ React
+ Vite
+ TypeScript
+ Tailwind
+ shadcn/ui
+ i18n
+ testing
+ security baseline
+ packaging
+ update infrastructure
```

and allow the developer to immediately focus on business features.

### Primary principle

> Infrastructure is reusable; business code is project-specific.

The template should provide:

- Electron architecture
- React application structure
- secure IPC
- desktop APIs
- reusable UI
- common application modules
- configuration
- persistence
- i18n
- API/client infrastructure
- testing
- packaging
- signing
- updating
- CI
- extension points

It should NOT provide:

- business-specific features
- database schema
- backend services
- authentication provider implementation
- domain-specific API
- business rules

---

# 2. Recommended Stack

## Core

```text
Electron
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Biome
```

Vite is appropriate for the renderer and can also participate in Electron build tooling. Electron Forge officially provides a Vite plugin/template, although the Forge Vite plugin is currently documented as experimental, so the project should isolate Forge-specific build configuration rather than coupling application architecture to it.

## i18n

```text
react-intl
@formatjs/cli
```

Use FormatJS/React Intl rather than introducing a second abstraction layer.

FormatJS officially supports message extraction, compilation, and verification through `@formatjs/cli`.

## Forms

```text
react-hook-form
zod
```

## Server State

```text
@tanstack/react-query
```

Use this for external API/server state rather than treating server data as global client state. TanStack Query explicitly focuses on fetching, caching, synchronizing, and updating server state.

## Testing

```text
vitest
@testing-library/react
@testing-library/user-event
@playwright/test
```

## Packaging

```text
Electron Forge
```

Electron itself recommends Electron Forge for application packaging and distribution.

---

# 3. Package Strategy

Do NOT make one huge package that contains the entire application runtime.

Use three layers.

```text
                  create-electron-app
                         │
                         ▼
                Project Template
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     electron-core   electron-ui   optional modules
```

## Layer 1 — Scaffold Package

Example:

```text
@your-scope/create-electron-app
```

Responsibilities:

- create project
- copy template
- configure project
- select optional modules
- initialize i18n
- initialize testing
- initialize Electron
- initialize Forge
- generate configuration

Example:

```bash
pnpm dlx @your-scope/create-electron-app my-app
```

---

## Layer 2 — Core Packages

Possible packages:

```text
@your-scope/electron-core
@your-scope/electron-ipc
@your-scope/electron-config
@your-scope/electron-storage
@your-scope/electron-ui
```

Keep these small and independently versioned.

---

## Layer 3 — Optional Modules

Examples:

```text
@your-scope/electron-tray
@your-scope/electron-updater
@your-scope/electron-shortcuts
@your-scope/electron-deeplink
@your-scope/electron-logging
@your-scope/electron-auto-launch
```

Projects only install what they need.

---

# 4. Why This Structure?

A template and a runtime library have different lifecycles.

A template should allow:

```text
copy
modify
own the code
```

A runtime library should provide:

```text
stable reusable abstractions
```

For UI, prefer copying/adopting shadcn components into each application rather than creating an opaque UI dependency. The official shadcn workflow is explicitly designed around adding component source to the application.

Therefore:

```text
shadcn/ui
→ project source

Electron infrastructure
→ reusable package
```

---

# 5. High-Level Architecture

The architecture should clearly separate Electron's processes.

```text
                         Electron App
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        Main Process                       Renderer
             │                                 │
        Node.js/Electron                    React
             │                                 │
        Preload Bridge                         │
             │                                 │
             └──────────── IPC ────────────────┘
                              │
                         OS / Native APIs
```

Renderer code must not directly access Node.js or arbitrary Electron APIs.

Electron's process model explicitly separates the main, renderer, and preload environments, and recommends using `contextBridge`/IPC to expose narrowly scoped APIs.

---

# 6. Electron Security Baseline

The template should start secure rather than adding security later.

Default BrowserWindow policy:

```text
nodeIntegration: false
contextIsolation: true
sandbox: true
```

Also:

- restrictive CSP
- HTTPS for remote content
- no `webSecurity: false`
- no unrestricted navigation
- no unrestricted new windows
- validate IPC sender
- do not expose raw `ipcRenderer`
- use narrowly scoped preload APIs
- restrict external URL handling
- explicit permission handlers
- current Electron version
- appropriate Electron fuses

Electron's official security checklist recommends these practices, including context isolation, sandboxing, restrictive CSP, navigation restrictions, sender validation, current Electron versions, and checking applicable fuses.

---

# 7. Preload Architecture

Do not expose:

```text
window.electron
window.ipcRenderer
window.require
```

as unrestricted objects.

Instead:

```text
window.desktop = {
  app: {...},
  window: {...},
  dialog: {...},
  shell: {...},
  files: {...},
}
```

Each method should represent a specific capability.

Example:

```text
desktop.dialog.openFile()
desktop.window.minimize()
desktop.app.getVersion()
```

Electron explicitly warns against exposing the entire `ipcRenderer` API and recommends exposing specific APIs through `contextBridge`.

---

# 8. Typed IPC

Create a typed IPC contract.

Example:

```text
src/shared/ipc/
  channels.ts
  types.ts
```

Conceptually:

```ts
interface DesktopAPI {
  app: {
    getVersion(): Promise<string>
  }

  window: {
    minimize(): void
    maximize(): void
    close(): void
  }

  dialog: {
    openFile(): Promise<string | null>
  }
}
```

The renderer should consume:

```text
window.desktop
```

rather than Electron internals.

---

# 9. IPC Rules

Every IPC channel should define:

```text
channel
request schema
response schema
sender policy
permission
```

Example:

```text
dialog.open-file
```

rather than generic:

```text
execute
```

Avoid:

```text
ipc.invoke("run-anything", payload)
```

Prefer explicit capabilities.

---

# 10. IPC Security

Every main-process IPC handler should validate:

```text
sender
input
origin/window
permissions
```

Do not trust renderer arguments.

Renderer is not a trusted environment simply because it is your application.

Electron specifically recommends validating the sender of IPC messages.

---

# 11. Project Structure

Recommended:

```text
.
├── src/
│   ├── main/
│   │   ├── app/
│   │   ├── windows/
│   │   ├── ipc/
│   │   ├── menus/
│   │   ├── tray/
│   │   ├── protocol/
│   │   └── services/
│   │
│   ├── preload/
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   ├── renderer/
│   │   ├── app/
│   │   ├── routes/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── styles/
│   │
│   ├── shared/
│   │   ├── types/
│   │   ├── schemas/
│   │   ├── constants/
│   │   └── utils/
│   │
│   └── config/
│
├── tests/
│   ├── unit/
│   ├── component/
│   ├── integration/
│   └── e2e/
│
├── public/
│
├── forge.config.ts
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── biome.json
├── package.json
└── README.md
```

Keep process boundaries visible in the filesystem.

---

# 12. Renderer Architecture

Use standard React architecture:

```text
renderer/
  app/
  routes/
  components/
  features/
  hooks/
  lib/
```

Use feature-oriented organization.

Example:

```text
features/
  settings/
    components/
    hooks/
    api/
    schemas/
    types/
```

Do not put all domain code into giant global folders.

---

# 13. Routing

For applications with multiple views, add a router.

Recommended:

```text
React Router
```

Keep routing entirely inside the renderer unless navigation requires native window management.

Example:

```text
/settings
/users
/dashboard
/about
```

The Electron main process manages application windows; React Router manages UI navigation inside a window.

---

# 14. UI

Use:

```text
shadcn/ui
Tailwind
Lucide React
```

Build a small initial UI foundation.

### Layout

```text
AppShell
Sidebar
Header
PageContainer
PageHeader
```

### Navigation

```text
Tabs
Breadcrumb
Dropdown Menu
Command Menu
```

### Forms

```text
Input
Textarea
Select
Checkbox
Radio
Switch
Date Picker
```

### Feedback

```text
Dialog
Alert
Toast
Tooltip
Popover
```

### Data

```text
Table
Badge
Pagination
Skeleton
```

---

# 15. Design Tokens

Use semantic tokens:

```text
background
foreground
primary
secondary
muted
destructive
border
input
ring
```

Also define:

```text
spacing
radius
typography
shadows
```

A new project's branding should be changeable without rewriting the application.

---

# 16. Theme

Support:

```text
light
dark
system
```

Provide:

```text
ThemeProvider
ThemeToggle
```

Theme state should be persisted locally.

---

# 17. Internationalization

Use:

```text
react-intl
@formatjs/cli
```

Recommended structure:

```text
locales/
  en/
    common.json
    navigation.json
    validation.json
    errors.json

  zh-CN/
    common.json
    navigation.json
    validation.json
    errors.json
```

Use ICU message syntax.

FormatJS provides message extraction, compilation, and verification tooling; this should be integrated into CI.

---

# 18. i18n Rules

Never hard-code user-facing strings.

Every new message should contain:

```text
id
defaultMessage
description
```

Run:

```text
pnpm i18n:extract
pnpm i18n:compile
pnpm i18n:verify
```

CI should fail when required translations/messages are invalid.

---

# 19. Form Architecture

Use:

```text
React Hook Form
+
Zod
```

Standard pattern:

```text
Zod schema
      ↓
React Hook Form
      ↓
UI
      ↓
mutation
      ↓
success/error
```

Keep validation schemas reusable.

---

# 20. API Architecture

Desktop applications frequently communicate with:

```text
REST API
GraphQL API
WebSocket
local service
```

The template should primarily support REST/HTTP without forcing GraphQL.

Provide:

```text
src/renderer/lib/api/
  client.ts
  errors.ts
  types.ts
```

Centralize:

- base URL
- headers
- authentication
- timeout
- serialization
- error normalization
- request IDs

Avoid raw `fetch()` scattered throughout components.

---

# 21. TanStack Query

Use TanStack Query for external server state when needed:

```text
queries
mutations
pagination
infinite queries
cache invalidation
optimistic updates
polling
```

Do NOT use it as a general-purpose local state manager.

Keep:

```text
server state
```

separate from:

```text
client state
```

TanStack Query is specifically designed around server-state lifecycle and caching.

---

# 22. Client State

Default:

```text
React state
Context
```

Add Zustand only when real cross-component state appears.

Do not introduce Redux by default.

Typical local state:

```text
modal state
sidebar state
editor state
temporary UI state
user preferences
```

---

# 23. Persistent Storage

Provide a storage abstraction.

Separate:

```text
non-sensitive settings
```

from:

```text
secrets
```

Example:

```text
settings
  theme
  locale
  window size
  preferences

secrets
  API tokens
  refresh tokens
  credentials
```

For secrets, use Electron `safeStorage` rather than plain JSON/config storage. Electron documents `safeStorage` as providing OS-backed protection and recommends the asynchronous API.

---

# 24. Configuration

Provide:

```text
src/config/
  app.ts
  env.ts
  schema.ts
```

Example:

```text
appName
appVersion
defaultLocale
supportedLocales
apiBaseUrl
features
```

Validate configuration on startup.

---

# 25. Window Management

Create a reusable window manager.

Support:

```text
main window
secondary window
modal window
preferences window
about window
```

Example:

```text
windowManager.open("settings")
windowManager.open("about")
```

Store:

```text
window size
window position
maximized state
```

where appropriate.

---

# 26. Native Desktop Modules

Common modules worth implementing once:

```text
Window Management
Dialogs
Menus
Tray
Notifications
Clipboard
Shell/Open External
File Picker
File Save Dialog
Global Shortcuts
Deep Links
Auto Launch
Single Instance
Power/Lifecycle
App Paths
System Info
```

These become reusable capabilities across projects.

---

# 27. Single Instance

The template should optionally enforce one application instance.

Example:

```text
second launch
     ↓
existing instance
     ↓
focus existing window
     ↓
forward arguments/deep-link
```

This is useful for:

```text
file association
deep links
desktop integrations
```

and should be implemented in the main process.

---

# 28. Deep Links / Custom Protocol

Provide optional support:

```text
myapp://settings
myapp://document/123
```

Architecture:

```text
OS
 ↓
Electron main
 ↓
validate URL
 ↓
route message
 ↓
renderer
```

Never allow arbitrary URLs to become arbitrary IPC commands.

---

# 29. External Links

Never blindly call:

```text
shell.openExternal(userProvidedUrl)
```

Electron explicitly warns about using `shell.openExternal` with untrusted content.

Provide:

```text
openExternal(url)
```

with:

```text
protocol allowlist
hostname policy
URL validation
```

Recommended default:

```text
https:
mailto:
```

and project-specific additions.

---

# 30. Permission Management

Electron's `session` API allows applications to explicitly handle permission requests/checks.

The template should provide hooks for:

```text
notifications
media
geolocation
USB
HID
serial
filesystem access
```

Do not automatically grant all permissions.

Use:

```text
origin
permission
user intent
```

to make decisions.

---

# 31. Remote Content Policy

Default:

```text
local application UI
```

If a project needs remote content:

```text
HTTPS only
separate BrowserWindow/WebContentsView
no Node integration
context isolation
sandbox
restricted navigation
restricted permissions
```

Electron explicitly warns that remote/untrusted content must not run with Node integration enabled.

---

# 32. Content Security Policy

Provide a default restrictive CSP.

Conceptually:

```text
default-src 'self'
script-src 'self'
style-src 'self'
img-src 'self' data: https:
connect-src 'self' https:
```

Adjust only when necessary.

Do not use:

```text
unsafe-eval
```

or:

```text
*
```

without a documented reason.

---

# 33. Electron Fuses

Include package-time Electron fuse configuration.

Evaluate at minimum:

```text
RunAsNode
NodeOptions
NodeCliInspect
CookieEncryption
```

according to application requirements.

Electron documents fuses as package-time feature switches that can disable powerful unused functionality and improve security posture.

---

# 34. Native Modules

The template should anticipate native npm modules:

```text
sqlite
better-sqlite3
node-pty
serialport
usb
```

Build/package configuration must handle native modules correctly.

Electron Forge provides an auto-unpack-natives plugin specifically for unpacking native Node modules from ASAR when needed.

Native dependencies should be optional rather than installed into every project.

---

# 35. Auto Update

Provide an updater abstraction:

```text
updateService.check()
updateService.download()
updateService.install()
```

Do not tightly couple application UI to a particular update provider.

Important platform reality:

```text
macOS → Electron autoUpdater
Windows → Electron autoUpdater
Linux → distribution/package-manager strategy
```

Electron's built-in `autoUpdater` currently supports macOS and Windows; Linux does not have built-in auto-update support and Electron recommends using the distribution's package manager.

---

# 36. Packaging

Use Electron Forge as the packaging/distribution layer.

Typical lifecycle:

```text
development
    ↓
Vite build
    ↓
Electron package
    ↓
installer
    ↓
sign
    ↓
publish
```

Electron officially recommends Forge for packaging/distribution.

---

# 37. Platform Targets

Initial target:

```text
Windows
macOS
Linux
```

Typical outputs:

```text
Windows
  .exe / installer

macOS
  .app
  .dmg / zip

Linux
  AppImage
  deb
```

Platform-specific makers should remain configurable.

---

# 38. Code Signing

Treat signing as part of the production pipeline.

```text
build
 ↓
sign
 ↓
notarize where applicable
 ↓
publish
```

Do not treat code signing as a post-release manual step.

Electron recommends code signing for distributed applications because it establishes authenticity and reduces OS security warnings.

---

# 39. CI/CD

Recommended CI pipeline:

```text
Install
 ↓
Biome
 ↓
Typecheck
 ↓
Unit
 ↓
Component
 ↓
Build
 ↓
E2E
 ↓
Package
 ↓
Sign
 ↓
Publish
```

Build each target platform on appropriate CI runners.

Do not assume one OS can produce every production artifact reliably.

Electron's publishing guidance recommends CI for multi-platform distributables when appropriate.

---

# 40. Testing Strategy

Use four layers.

## Unit

Vitest.

Test:

```text
utilities
schemas
business logic
configuration
IPC validation
```

## Component

React Testing Library.

Test:

```text
forms
dialogs
navigation
loading
error
empty
user interactions
```

Testing Library's guiding principle is to test in ways resembling actual user interaction rather than implementation details.

## Integration

Test:

```text
renderer
 ↕
preload
 ↕
main
```

for important IPC flows.

## E2E

Playwright.

Electron can be launched with Playwright's Electron support, although Playwright currently documents Electron automation as experimental.

Use E2E for:

```text
application startup
navigation
critical workflows
dialogs
file operations
window behavior
IPC-driven functionality
```

---

# 41. Playwright Strategy

Follow Playwright best practices:

- test user-visible behavior
- keep tests isolated
- avoid implementation-specific selectors
- use resilient locators
- collect traces/screenshots on failure

Playwright explicitly recommends user-visible behavior and isolated tests.

For Electron-specific functionality:

```text
launch Electron
 ↓
get BrowserWindow page
 ↓
interact as user
 ↓
verify visible result
```

---

# 42. Test Doubles for Native APIs

Native APIs should be mockable.

Examples:

```text
dialog
notification
shell
clipboard
filesystem
autoUpdater
```

Do not make unit tests depend on actual OS dialogs.

Playwright's Electron support also notes that native dialogs are OS-level and should be stubbed for deterministic testing.

---

# 43. Logging

Provide a structured logging abstraction.

Example:

```text
logger.debug()
logger.info()
logger.warn()
logger.error()
```

Separate:

```text
development logs
production logs
audit/security logs
```

Never casually log:

```text
password
token
cookie
authorization header
private key
```

---

# 44. Crash / Error Handling

Provide:

```text
renderer error boundary
main-process error handling
unhandled rejection handling
uncaught exception handling
```

The UI should display useful errors without exposing internal details.

---

# 45. Audit / Diagnostics

For applications that need it, provide an optional diagnostics bundle:

```text
app version
OS
Electron version
renderer version
configuration summary
recent logs
```

Never automatically export secrets.

---

# 46. Desktop UX Modules

Useful reusable modules:

```text
Command Palette
Keyboard Shortcut Manager
Notification Center
Update Banner
About Dialog
Preferences
Help
Feedback
Status Bar
Connection Status
Offline State
```

These are common enough to justify inclusion.

---

# 47. Offline / Network State

Desktop applications should expect intermittent connectivity.

Provide reusable states:

```text
Online
Offline
Connecting
Disconnected
Retrying
```

Integrate these with TanStack Query where applicable.

---

# 48. Common Data States

Every API-driven UI should handle:

```text
loading
success
empty
error
offline
unauthorized
forbidden
not found
```

Provide reusable:

```text
LoadingState
EmptyState
ErrorState
OfflineState
UnauthorizedState
NotFoundState
```

---

# 49. Accessibility

Baseline:

```text
semantic HTML
keyboard navigation
visible focus
labels
ARIA where necessary
accessible dialogs
screen reader support
color contrast
```

Avoid using div-based custom controls when a native/accessibility primitive already exists.

---

# 50. Dependency Policy

Every dependency should answer:

> Is this common infrastructure or a real recurring problem?

### Core

```text
electron
react
react-dom
typescript
vite
tailwindcss
shadcn/ui
@biomejs/biome
```

### Common

```text
react-intl
@formatjs/cli
react-hook-form
zod
vitest
@testing-library/react
@testing-library/user-event
@playwright/test
```

### Optional

```text
@tanstack/react-query
zustand
router
electron-store
additional Electron plugins
```

Keep the default project small.

---

# 51. Package Manager

Standardize the template on:

```text
pnpm
```

Use:

```text
pnpm-lock.yaml
```

and enforce reproducible dependency installation in CI.

Avoid supporting multiple package managers in the template unless there is a concrete need.

---

# 52. TypeScript Configuration

Use strict TypeScript.

Recommended:

```text
strict: true
noUncheckedIndexedAccess: true
exactOptionalPropertyTypes: true
```

where practical.

Separate process environments:

```text
main tsconfig
preload tsconfig
renderer tsconfig
```

This helps prevent accidentally importing Node/Electron APIs into renderer code.

---

# 53. Import Boundaries

Enforce architectural boundaries.

Renderer must not import:

```text
electron
node:fs
node:child_process
node:net
```

directly.

Main must not import renderer UI code.

Preload should remain thin.

Conceptually:

```text
renderer
   ↓
preload API
   ↓
main services
   ↓
OS
```

---

# 54. Feature Modules

A feature should look like:

```text
features/
  settings/
    components/
    hooks/
    api/
    schemas/
    types/
```

Feature code owns:

```text
UI
API
validation
types
state
```

Infrastructure remains outside the feature.

---

# 55. Extension System

Design for extensions without making plugins mandatory.

The first version should support **in-process, compile-time extensions**.

Example:

```text
plugins/
  register.ts
  types.ts
```

Plugin contract:

```text
Plugin
  id
  name
  initialize()
  dispose()
  contributeMenu()
  contributeCommands()
  contributeWindows()
  contributeIPC()
```

---

# 56. Extension Boundary

A plugin should declare capabilities.

Example:

```text
plugin:
  filesystem
  shell
  notifications
  network
```

The plugin must not automatically receive unlimited Electron access.

Prefer:

```text
Plugin
 ↓
Plugin API
 ↓
Capability
 ↓
Electron core
```

rather than:

```text
Plugin
 ↓
full Electron API
```

---

# 57. Extension Security

Do not initially support arbitrary third-party remote plugin installation.

Start with:

```text
bundled plugins
trusted local plugins
```

Later:

```text
signed plugins
permission manifest
plugin sandbox
plugin marketplace
```

Electron security guidance makes clear that executing untrusted code locally is a serious security boundary issue.

---

# 58. Example Plugin

Conceptually:

```text
ExamplePlugin
 ├── id
 ├── commands
 ├── menu items
 ├── settings
 └── lifecycle
```

A plugin could add:

```text
"Export Markdown"
```

without modifying Electron core.

---

# 59. Feature Flags

Provide lightweight feature flags:

```text
features:
  commandPalette: true
  tray: true
  autoUpdate: false
```

Use them for optional modules.

Do not add a remote feature-flag platform to the base template.

---

# 60. Configuration UX

Provide an initial setup command:

```bash
pnpm setup
```

or:

```bash
pnpm dlx @your-scope/create-electron-app
```

Interactive options:

```text
Application name
Bundle identifier
Default language
Supported languages
Theme
Router
TanStack Query
Tray
Auto Update
Deep Link
Logging
```

Only enable optional modules selected by the project.

---

# 61. Example Generated Project

After scaffolding:

```text
my-app/
├── src/
├── tests/
├── public/
├── forge.config.ts
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── biome.json
├── package.json
├── tsconfig.json
└── README.md
```

Running:

```bash
pnpm dev
```

should immediately launch the Electron application.

---

# 62. Standard Scripts

```text
pnpm dev
pnpm build

pnpm lint
pnpm format
pnpm format:check
pnpm typecheck

pnpm test
pnpm test:watch
pnpm test:e2e

pnpm i18n:extract
pnpm i18n:compile
pnpm i18n:verify

pnpm package
pnpm make
pnpm publish
```

---

# 63. Development Workflow

Recommended:

```text
pnpm dev
       ↓
Vite HMR
       ↓
React development
       ↓
Electron main/preload rebuild
       ↓
desktop application
```

Vite's native ESM/HMR workflow provides fast development feedback and React Fast Refresh integration.

---

# 64. Release Workflow

```text
feature development
       ↓
PR
       ↓
format/lint/typecheck
       ↓
unit/component
       ↓
build
       ↓
E2E
       ↓
release tag
       ↓
multi-platform build
       ↓
code signing
       ↓
publish
       ↓
update metadata
```

---

# 65. Documentation

Every generated project should include:

```text
README.md
ARCHITECTURE.md
CONTRIBUTING.md
CHANGELOG.md
SECURITY.md
.env.example
```

`ARCHITECTURE.md` should explain:

```text
main
preload
renderer
IPC
security boundary
storage
extension system
testing
release
```

---

# 66. Security Documentation

`SECURITY.md` should explicitly document:

```text
Node integration policy
context isolation
sandbox
CSP
IPC policy
permission policy
external navigation
secret handling
plugin model
update mechanism
code signing
```

This prevents future developers from accidentally weakening the security model.

---

# 67. Implementation Phases

## Phase 1 — Foundation

```text
Electron
Vite
React
TypeScript
Tailwind
Biome
```

Deliver:

```text
dev workflow
main
preload
renderer
basic window
secure defaults
```

---

## Phase 2 — Secure IPC

```text
contextBridge
typed IPC
schemas
sender validation
capability-based APIs
```

This is one of the highest-priority phases.

---

## Phase 3 — UI Foundation

```text
shadcn/ui
theme
layout
navigation
dialogs
forms
feedback
loading states
```

---

## Phase 4 — Application Infrastructure

```text
React Router
React Intl
React Hook Form
Zod
TanStack Query
API client
configuration
storage
```

---

## Phase 5 — Native Modules

```text
window manager
tray
menus
notifications
dialogs
clipboard
shell
shortcuts
deep links
single instance
```

---

## Phase 6 — Testing

```text
Vitest
React Testing Library
Playwright
IPC tests
Electron E2E
CI
```

---

## Phase 7 — Distribution

```text
Electron Forge
packaging
makers
code signing
publishing
auto-update
```

---

## Phase 8 — Extension System

```text
plugin interface
capabilities
plugin lifecycle
menu contributions
commands
settings
```

---

# 68. P0 — Must Have

```text
Electron
React
Vite
TypeScript
Tailwind
shadcn/ui
Biome

secure BrowserWindow
preload
contextBridge
typed IPC

React Intl
React Hook Form
Zod

Vitest
React Testing Library
Playwright

Electron Forge
```

---

# 69. P1 — High Value

```text
React Router
TanStack Query
API client
configuration
persistent settings
safeStorage integration

window manager
dialogs
tray
notifications
clipboard
external links
keyboard shortcuts
single instance
```

---

# 70. P2 — Optional Modules

```text
deep linking
auto launch
auto update
system information
offline state
diagnostics
logging
advanced menus
plugin system
```

---

# 71. P3 — Future

```text
signed plugins
plugin marketplace
sandboxed plugins
WebSocket abstraction
local database
background workers
multi-window coordination
advanced telemetry
```

---

# 72. Things NOT Included by Default

Do not automatically include:

```text
Redux
GraphQL
ORM
database
specific auth provider
specific backend
remote plugin marketplace
analytics vendor
Sentry vendor
cloud service
business-specific UI
```

Optional infrastructure should remain modular.

---

# 73. Definition of Done

A new project should be able to go from:

```text
pnpm dlx @your-scope/create-electron-app my-app
```

to:

```text
pnpm dev
```

and immediately have:

```text
Electron application
React UI
Vite HMR
TypeScript
Tailwind
shadcn/ui
dark mode
i18n
forms
validation
API layer
loading/error/empty states
secure IPC
testing
```

Without additional infrastructure setup.

For production, the same project should have a clear path to:

```text
package
sign
publish
update
```

---

# 74. Final Architecture

```text
                        Electron Application
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
         Main Process                           Renderer
              │                                     │
       Node.js / Electron                         React
              │                                     │
       ┌──────┼───────┐                    ┌────────┼────────┐
       │      │       │                    │        │        │
    Windows  IPC   Services               UI      State     i18n
       │      │       │                    │        │        │
       │   Preload    │                 shadcn   TanStack   React
       │      │       │                 Tailwind   Query     Intl
       └──────┼───────┘
              │
         Secure API Boundary
              │
      ┌───────┴────────┐
      │                │
   Native OS       External API
      │                │
 files/window/etc.   REST/etc.


Cross-cutting:

Security
  ├── sandbox
  ├── contextIsolation
  ├── CSP
  ├── IPC validation
  ├── permissions
  ├── navigation policy
  └── Electron fuses

Quality
  ├── TypeScript
  ├── Biome
  ├── Vitest
  ├── RTL
  └── Playwright

Distribution
  ├── Forge
  ├── signing
  ├── packaging
  ├── publishing
  └── updates

Extensions
  ├── plugins
  ├── capabilities
  ├── commands
  ├── menus
  └── windows
```

# 75. Most Important Engineering Rules

### Rule 1

```text
Renderer ≠ Main
```

Never blur the process boundary.

### Rule 2

```text
Preload = narrow capability bridge
```

Never expose unrestricted Electron/Node APIs.

### Rule 3

```text
IPC = typed + validated + permission-aware
```

### Rule 4

```text
Server State ≠ Client State
```

Use TanStack Query only for server state.

### Rule 5

```text
UI source belongs to the project
```

Prefer shadcn source components over a giant UI abstraction package.

### Rule 6

```text
Optional capabilities = modules
```

Do not force every project to ship tray, updater, deep-linking, plugins, etc.

### Rule 7

```text
Security defaults must be difficult to accidentally disable
```

### Rule 8

```text
Template = infrastructure
Feature = business
```

Keep these boundaries intact.

---

# 76. Recommended Final Package Ecosystem

A mature version can evolve toward:

```text
@your-scope/create-electron-app
        │
        ├── @your-scope/electron-core
        ├── @your-scope/electron-ipc
        ├── @your-scope/electron-config
        ├── @your-scope/electron-storage
        ├── @your-scope/electron-window
        │
        ├── @your-scope/electron-tray
        ├── @your-scope/electron-shortcuts
        ├── @your-scope/electron-deeplink
        ├── @your-scope/electron-updater
        └── @your-scope/electron-logging
```

The **scaffold package** creates the application.

The **core packages** provide stable Electron infrastructure.

The **optional packages** add capabilities only when needed.

The actual application's:

```text
features/
components/
pages/
business logic/
API definitions/
```

remain owned by each project.

That is the architecture I would use for a reusable internal Electron platform: **strong opinions at the process/security/build/test boundaries, but loose coupling at the business-feature boundary.**