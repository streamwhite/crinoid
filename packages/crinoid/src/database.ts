export type SqlParams = readonly unknown[]

export interface SqlDriver {
  run(sql: string, params?: SqlParams): Promise<void>
  all<T>(sql: string, params?: SqlParams): Promise<T[]>
  close(): Promise<void>
}

export interface Migration {
  readonly id: string
  readonly up: string
}

export interface RepositoryOptions {
  readonly table: string
  readonly primaryKey: string
}

export interface Repository<T> {
  find(id: string | number): Promise<T | null>
  list(): Promise<T[]>
  insert(record: T): Promise<void>
  update(record: T): Promise<void>
  remove(id: string | number): Promise<void>
}

export interface DatabaseOptions {
  readonly driver: SqlDriver
  readonly migrations?: readonly Migration[]
  readonly onMigration?: ((migration: Migration) => void) | undefined
}

export interface Database {
  run(sql: string, params?: SqlParams): Promise<void>
  all<T>(sql: string, params?: SqlParams): Promise<T[]>
  repository<T extends Record<string, unknown>>(options: RepositoryOptions): Repository<T>
  close(): Promise<void>
}

const MIGRATIONS_TABLE = 'migrations'
const MAX_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/

export async function runMigrations(driver: SqlDriver, migrations: readonly Migration[]): Promise<number> {
  await driver.run(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)`)
  const rows = await driver.all<{ id: string }>(`SELECT id FROM ${MIGRATIONS_TABLE}`)
  const applied = new Set(rows.map((row) => row.id))
  let count = 0
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue
    await driver.run(migration.up)
    await driver.run(`INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES (?, ?)`, [migration.id, Date.now()])
    count += 1
  }
  return count
}

export async function createDatabase(options: DatabaseOptions): Promise<Database> {
  if (options.migrations?.length) {
    await runMigrations(options.driver, options.migrations)
    for (const migration of options.migrations) options.onMigration?.(migration)
  }

  return {
    run: (sql, params) => options.driver.run(sql, params),
    all: <T>(sql: string, params?: SqlParams) => options.driver.all<T>(sql, params),
    repository: <T extends Record<string, unknown>>(repositoryOptions: RepositoryOptions) =>
      createRepository<T>(options.driver, repositoryOptions),
    close: () => options.driver.close()
  }
}

export function createRepository<T extends Record<string, unknown>>(driver: SqlDriver, options: RepositoryOptions): Repository<T> {
  assertIdentifier(options.table)
  assertIdentifier(options.primaryKey)
  const { table, primaryKey } = options

  return {
    find: async (id) => {
      const rows = await driver.all<T>(`SELECT * FROM ${table} WHERE ${primaryKey} = ? LIMIT 1`, [id])
      return rows[0] ?? null
    },
    list: () => driver.all<T>(`SELECT * FROM ${table}`),
    insert: async (record) => {
      const columns = Object.keys(record)
      columns.forEach(assertIdentifier)
      const placeholders = columns.map(() => '?').join(', ')
      await driver.run(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, columns.map((column) => record[column]))
    },
    update: async (record) => {
      const columns = Object.keys(record).filter((column) => column !== primaryKey)
      columns.forEach(assertIdentifier)
      const assignments = columns.map((column) => `${column} = ?`).join(', ')
      await driver.run(`UPDATE ${table} SET ${assignments} WHERE ${primaryKey} = ?`, [
        ...columns.map((column) => record[column]),
        record[primaryKey]
      ])
    },
    remove: (id) => driver.run(`DELETE FROM ${table} WHERE ${primaryKey} = ?`, [id])
  }
}

function assertIdentifier(value: string): void {
  if (!MAX_IDENTIFIER.test(value)) throw new Error(`Invalid SQL identifier: ${value}`)
}
