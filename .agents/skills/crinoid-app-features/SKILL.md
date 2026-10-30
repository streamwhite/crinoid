---
name: crinoid-app-features
description: Add common desktop application features with crinoid. Use when implementing settings with migrations, About information, allowlisted help links, in-app keybindings, command palettes, fuzzy search, favorites, undo/redo history, or drag-and-drop file/text handling. Triggers on createSettings, createAboutInfo, createHelpService, createKeybindingRegistry, createCommandRegistry, fuzzyScore, createFavorites, createHistory, readDroppedItems, createDropController.
---

# Crinoid app features

These modules cover the features most desktop apps end up rebuilding. Prefer them over ad-hoc
implementations, and keep feature-specific composition under `src/features/<feature>/`.

## Settings with migrations

```ts
import { createSettings } from 'crinoid/settings'
import { createFileStorage } from 'crinoid/storage'

type SettingsShape = { theme: string; zoom: number }

const settings = await createSettings<SettingsShape>({
  storage: createFileStorage<unknown>(join(app.getPath('userData'), 'settings.json')),
  defaults: { theme: 'light', zoom: 1 },
  version: 2,
  migrate: (value, fromVersion) => ({
    ...(value as SettingsShape),
    ...(fromVersion < 2 ? { zoom: 1 } : {})
  })
})

settings.get('theme')
settings.set('theme', 'dark')
await settings.flush()
```

For per-key reactive preferences in the renderer, use `createPreferences` through
`createMainProcess({ preferences })`; see `crinoid-data`.

## About and Help

```ts
import { createAboutInfo, formatAboutText } from 'crinoid/about'
import { createHelpService } from 'crinoid/help'

const about = createAboutInfo({
  name: 'My App',
  version: app.getVersion(),
  platform: process.platform,
  arch: process.arch,
  versions: { electron: process.versions.electron }
})
const text = formatAboutText(about)

const help = createHelpService({
  links: {
    docs: 'https://example.com/docs',
    issues: 'https://example.com/issues'
  },
  openExternal: (url) => shell.openExternal(url)
})

await help.open('docs')
```

Help links are allowlisted (`https` only) and report whether a key exists.

## Keybindings and keyboard shortcuts

```ts
import { createKeybindingRegistry, formatKeybinding, matchesKeybinding, parseKeybinding } from 'crinoid/keybindings'

const binding = parseKeybinding('CommandOrControl+K')
if (matchesKeybinding(event, binding)) openPalette()
const label = formatKeybinding(binding)

const registry = createKeybindingRegistry()
registry.register('CommandOrControl+K', () => openPalette())
registry.handle(event)
```

In React, use `useKeyboardShortcuts` from `crinoid/react`. Global accelerators belong to the main process:
`createShortcutManager`; see `crinoid-main-process`.

## Command palette and search

```ts
import { createCommandRegistry } from 'crinoid/command-palette'
import { fuzzyScore, rankBy } from 'crinoid/search'

const commands = createCommandRegistry()
commands.register({ id: 'file.open', title: 'Open file', run: () => openFile() })
const results = commands.search('open')

const ranked = rankBy(items, 'opn', { keys: ['title'], limit: 20 })
```

`rankBy` uses subsequence scoring with stable ordering. Keep command ids stable; they are suitable for
keybindings, menus, and telemetry.

## Favorites and undo/redo history

```ts
import { createFavorites } from 'crinoid/favorites'
import { createHistory } from 'crinoid/history'

const favorites = createFavorites()
favorites.toggle({ id: 'note-1', title: 'First note' })
favorites.subscribe((items) => persistFavoriteIds(favorites.ids()))

const history = createHistory(editorState, { limit: 100 })
history.push(nextState)
history.undo()
history.redo()
```

Favorites are reactive and in-memory; persist their ids through preferences or a persistent store if they
must survive restarts. `createHistory` tracks past/present/future with a configurable limit and notifies
subscribers.

## Drag and drop

```ts
import { createDropController, readDroppedItems, readDroppedText } from 'crinoid/drag-drop'

const controller = createDropController()
controller.onDrop(event, (items) => {
  for (const item of items) handle(item)
})

const text = readDroppedText(event.dataTransfer)
const items = readDroppedItems(event.dataTransfer)
```

In the renderer, resolve a dropped `File` to an OS path with `desktop.fs.pathForFile(file)`. Do not rely on
`File.path`; modern Electron does not provide it.

## Rules

- Put all user-facing labels in the feature locale JSON; command titles and About text included.
- Version settings payloads and write migrations before changing their shape.
- Keep command ids, keybinding ids, and favorite ids stable across releases.
- Do not duplicate global shortcut registration inside feature components.
- Prefer `createHistory` over ad-hoc undo stacks so limits and notifications stay consistent.

## Authoritative references

`node_modules/crinoid/API.md` (common application capabilities) and `node_modules/crinoid/README.md`.
