import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createDatabase, runMigrations, type SqlDriver } from 'crinoid/database'
import { createSqliteDriver } from 'crinoid/sqlite'

const directories: string[] = []

async function scratch(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'electron-template-db-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('database migrations', () => {
  it('applies pending migrations in order and records them', async () => {
    const applied: string[] = []
    const driver: SqlDriver = {
      run: async (sql) => {
        applied.push(sql)
      },
      all: async () => [] as never,
      close: async () => {}
    }
    const migrations = [
      { id: '001-init', up: 'CREATE TABLE items (id TEXT)' },
      { id: '002-add-name', up: 'ALTER TABLE items ADD COLUMN name TEXT' }
    ]

    const count = await runMigrations(driver, migrations)

    expect(count).toBe(2)
    expect(applied).toEqual([
      'CREATE TABLE IF NOT EXISTS migrations (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)',
      'CREATE TABLE items (id TEXT)',
      expect.stringContaining('INSERT INTO migrations'),
      'ALTER TABLE items ADD COLUMN name TEXT',
      expect.stringContaining('INSERT INTO migrations')
    ])
  })

  it('skips migrations already recorded', async () => {
    const applied: string[] = []
    const driver: SqlDriver = {
      run: async (sql) => {
        applied.push(sql)
      },
      all: async (sql) => (sql.includes('SELECT') ? ([{ id: '001-init' }] as never) : ([] as never)),
      close: async () => {}
    }

    const count = await runMigrations(driver, [{ id: '001-init', up: 'CREATE TABLE items (id TEXT)' }])

    expect(count).toBe(0)
    expect(applied.some((sql) => sql.includes('items'))).toBe(false)
  })
})

describe('database repository', () => {
  it('runs migrations and exposes a working repository against real sqlite', async () => {
    const directory = await scratch()
    const driver = createSqliteDriver({ file: join(directory, 'app.db') })
    const database = await createDatabase({
      driver,
      migrations: [
        { id: '001-init', up: 'CREATE TABLE notes (id TEXT PRIMARY KEY, body TEXT)' },
        { id: '002-add-title', up: 'ALTER TABLE notes ADD COLUMN title TEXT' }
      ]
    })

    await database.run('INSERT INTO notes (id, body, title) VALUES (?, ?, ?)', ['n1', 'hello', 'Hi'])
    const rows = await database.all<{ id: string; title: string }>('SELECT id, title FROM notes')
    const notes = database.repository<{ id: string; body: string; title: string }>({
      table: 'notes',
      primaryKey: 'id'
    })
    const found = await notes.find('n1')

    expect(rows).toEqual([{ id: 'n1', title: 'Hi' }])
    expect(found?.title).toBe('Hi')
    await database.close()
  })
})
