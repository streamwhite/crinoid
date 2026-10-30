---
name: crinoid-data
description: Persist and manage local application data with crinoid. Use when adding stores, cross-window state, preferences, recent files, file read/write/watch, path or MIME helpers, key-value storage, caches, SQLite repositories and migrations, IndexedDB, or import/export/backup. Triggers on createStore, createPersistentStore, createStateSync, createPreferences, readText, writeJson, watchPath, createDatabase, createSqliteDriver, createIndexedDbStore, createDataTransfer.
---

# Crinoid data and state

Use the smallest storage layer that fits the data:

- **UI/session state** → `createStore` (optionally `createPersistentStore`).
- **Cross-window shared state** → `createStateSync` through `createMainProcess({ state })`.
- **User preferences** → `createPreferences` through `createMainProcess({ preferences })`.
- **Recent files/projects** → `createRecentItems` through `createMainProcess({ recentFiles })`.
- **Documents and binaries** → `crinoid/fs` (stream for large files).
- **Structured local records** → SQLite via `createDatabase`.
- **Renderer-only browser data** → `createIndexedDbStore`.
- **Import/export/backup** → `createDataTransfer`.

## Reactive and persisted state

```ts
import { createStore } from 'crinoid/reactive'
import { createPersistentStore } from 'crinoid/persistent'
import { createStateSync } from 'crinoid/state-sync'
import { createPreferences } from 'crinoid/preferences'
import { createRecentItems } from 'crinoid/recent-items'

const store = createStore({ theme: 'light' })
store.subscribe((value, previous) => console.log(previous, value))
const theme = store.select((state) => state.theme)

const persisted = await createPersistentStore({ storage, key: 'prefs', defaults: { theme: 'light' } })
const preferences = await createPreferences({ storage, defaults: { locale: 'en', zoom: 1 } })
const recent = createRecentItems({ limit: 10 })
```

`createMainProcess` wires these without manual composition:

```ts
createMainProcess({
  config,
  window,
  state: { initial: { theme: 'light' }, persistPath: join(app.getPath('userData'), 'state.json') },
  preferences: { defaults: { locale: 'en', zoom: 1 } },
  recentFiles: { limit: 10 }
})
```

Renderer surfaces: `desktop.store` (`get`/`set`/`onChange`), `desktop.preferences`
(`get`/`set`/`all`), and `desktop.recentFiles` (`add`/`list`/`remove`/`clear`).

## Files, paths, MIME, watching

```ts
import { readText, writeText, readJson, writeJson, listDirectory, copyPath, movePath, removePath, ensureDirectory } from 'crinoid/fs'
import { joinPath, isSubPath, uniquePath } from 'crinoid/paths'
import { detectMimeType, getFileCategory, isTextMimeType } from 'crinoid/mime'
import { watchPath } from 'crinoid/watch'
import { readTextStream, writeTextStream } from 'crinoid/stream'

await writeJson('/tmp/app.json', { ready: true })
const config = await readJson<{ ready: boolean }>('/tmp/app.json')
await ensureDirectory('/tmp/exports')
const watcher = watchPath('/tmp', (event) => console.log(event))
```

The renderer reaches the same operations through `desktop.fs`: `pickFile`, `pickDirectory`, `readText`,
`writeText`, `readJson`, `writeJson`, `list`, `exists`, `ensureDir`, `copy`, `move`, `remove`, `mime`,
`watch`, and `pathForFile`.

`desktop.fs.watch(path, listener)` returns a Promise resolving to a stop function. Use it in a React effect
and always call the stop function on cleanup.

## Key-value, cache, IndexedDB

```ts
import { createFileStorage, createKeyValueStorage } from 'crinoid/storage'
import { createCache } from 'crinoid/cache'
import { createIndexedDbStore } from 'crinoid/indexeddb'

const storage = createFileStorage<unknown>(join(app.getPath('userData'), 'data.json'))
const kv = createKeyValueStorage(storage, 'settings')

const cache = createCache<Profile>({ ttlMs: 60_000 })
const profile = await cache.get('profile', () => fetchProfile())

const idb = await createIndexedDbStore<Note>({
  factory: indexedDB,
  databaseName: 'app',
  storeName: 'notes'
})
```

`createCache` de-duplicates concurrent loads and expires entries by TTL. `createIndexedDbStore` returns a
Promise and uses `databaseName` / `storeName`.

## SQLite, repositories, migrations

```ts
import { createSqliteDriver } from 'crinoid/sqlite'
import { createDatabase } from 'crinoid/database'

const database = await createDatabase({
  driver: createSqliteDriver({ file: join(app.getPath('userData'), 'app.db') }),
  migrations: [{ id: '001-init', up: 'CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT)' }]
})

const notes = database.repository({ table: 'notes', primaryKey: 'id' })
await notes.insert({ id: crypto.randomUUID(), body: 'hello' })
const note = await notes.find(id)
```

`createDatabase` opens WAL with foreign keys, exposes `run`/`all`, applies pending migrations in order, and
returns CRUD repositories with identifier validation.

## Import, export, backup, restore

`createDataTransfer` exports a versioned snapshot and imports it as merge or replace, plus file-backed
backup and restore:

```ts
import { createDataTransfer } from 'crinoid/data-transfer'
import { readText, writeText } from 'crinoid/fs'

const transfer = createDataTransfer({ storage: kv, namespace: 'app', version: 1 })
const snapshot = await transfer.export()
await transfer.import(snapshot, { mode: 'merge' })

await transfer.backup({ write: async (contents) => writeText('/tmp/backup.json', contents) })
const restored = await transfer.restore({ read: async () => readText('/tmp/backup.json').catch(() => null) })
```

## Rules

- Keep server/API data in the API client (or TanStack Query), not in the global store.
- Use `createPreferences` for non-sensitive user settings; use `crinoid/secrets` for credentials.
- Validate paths before destructive operations; use `isSubPath` to keep writes inside an app directory.
- Do not read or write large files through IPC JSON when a stream or a main-process operation is available.
- Persist only serializable data; functions and class instances do not survive IPC or JSON.

## Authoritative references

`node_modules/crinoid/API.md` (application state, file system, database/local data) and the matching
`node_modules/crinoid/src/*.ts` files.
