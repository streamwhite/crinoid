import type { KeyValueStorage } from './storage/kv.js'

export interface DataSnapshot {
  readonly version: number
  readonly exportedAt?: number
  readonly data: Record<string, unknown>
}

export interface DataTransferOptions {
  readonly storage: KeyValueStorage<unknown>
  readonly namespace: string
  readonly version: number
  readonly onProgress?: ((processed: number) => void) | undefined
}

export interface ImportOptions {
  readonly mode?: 'merge' | 'replace'
}

export interface BackupPort {
  write(contents: string): Promise<void>
}

export interface RestorePort {
  read(): Promise<string | null>
}

export interface DataTransfer {
  export(): Promise<DataSnapshot>
  import(snapshot: DataSnapshot, options?: ImportOptions): Promise<void>
  backup(port: BackupPort): Promise<void>
  restore(port: RestorePort): Promise<boolean>
}

export function createDataTransfer(options: DataTransferOptions): DataTransfer {
  const prefix = `${options.namespace}:`

  const exportSnapshot = async (): Promise<DataSnapshot> => {
    const keys = await options.storage.keys()
    const data: Record<string, unknown> = {}
    let processed = 0
    for (const key of keys) {
      data[`${prefix}${key}`] = await options.storage.get(key)
      processed += 1
      options.onProgress?.(processed)
    }
    options.onProgress?.(processed)
    return { version: options.version, exportedAt: Date.now(), data }
  }

  const importSnapshot = async (snapshot: DataSnapshot, importOptions: ImportOptions = {}): Promise<void> => {
    if (snapshot.version > options.version) {
      throw new Error(`Snapshot version ${snapshot.version} is newer than supported ${options.version}`)
    }
    if (importOptions.mode === 'replace') {
      for (const key of await options.storage.keys()) await options.storage.remove(key)
    }
    for (const [key, value] of Object.entries(snapshot.data)) {
      if (!key.startsWith(prefix)) continue
      await options.storage.set(key.slice(prefix.length), value)
    }
  }

  return {
    export: exportSnapshot,
    import: importSnapshot,
    backup: async (port) => {
      const snapshot = await exportSnapshot()
      await port.write(JSON.stringify(snapshot))
    },
    restore: async (port) => {
      const contents = await port.read()
      if (!contents) return false
      await importSnapshot(JSON.parse(contents) as DataSnapshot, { mode: 'replace' })
      return true
    }
  }
}
