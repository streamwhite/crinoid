import { DatabaseSync } from 'node:sqlite'
import type { SqlDriver, SqlParams } from './database.js'

export interface SqliteDriverOptions {
  readonly file: string
  readonly readOnly?: boolean
}

export function createSqliteDriver(options: SqliteDriverOptions): SqlDriver {
  const database = new DatabaseSync(options.file, { readOnly: options.readOnly ?? false })
  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA journal_mode = WAL')

  return {
    run: async (sql, params = []) => {
      database.prepare(sql).run(...(params as unknown as never[]))
    },
    all: async <T>(sql: string, params: SqlParams = []) =>
      database.prepare(sql).all(...(params as unknown as never[])) as T[],
    close: async () => {
      database.close()
    }
  }
}
