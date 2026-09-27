export interface IdbRequestLike<T> {
  result: T
  onsuccess?: (() => void) | undefined
  onerror?: (() => void) | undefined
}

export interface IdbObjectStoreLike {
  get(key: string): IdbRequestLike<unknown>
  put(value: unknown, key: string): void
  delete(key: string): void
  getAllKeys(): IdbRequestLike<unknown[]>
}

export interface IdbTransactionLike {
  objectStore(): IdbObjectStoreLike
}

export interface IdbDatabaseLike {
  objectStoreNames: { contains(name: string): boolean }
  createObjectStore(name: string): void
  transaction(name: string): IdbTransactionLike
}

export interface IdbOpenRequestLike {
  result: IdbDatabaseLike
  onsuccess?: (() => void) | undefined
  onerror?: (() => void) | undefined
  onupgradeneeded?: (() => void) | undefined
}

export interface IdbFactoryLike {
  open(name: string, version?: number): IdbOpenRequestLike
}

export interface IndexedDbStoreOptions {
  readonly factory: IdbFactoryLike
  readonly databaseName: string
  readonly storeName: string
  readonly version?: number
}

export interface IndexedDbStore<T> {
  get(key: string): Promise<T | undefined>
  set(key: string, value: T): Promise<void>
  delete(key: string): Promise<void>
  keys(): Promise<string[]>
}

export function createIndexedDbStore<T>(options: IndexedDbStoreOptions): Promise<IndexedDbStore<T>> {
  return new Promise((resolve, reject) => {
    const request = options.factory.open(options.databaseName, options.version ?? 1)
    request.onupgradeneeded = (): void => {
      if (!request.result.objectStoreNames.contains(options.storeName)) request.result.createObjectStore(options.storeName)
    }
    request.onerror = (): void => reject(new Error(`Failed to open IndexedDB database ${options.databaseName}`))
    request.onsuccess = (): void => {
      const database = request.result
      resolve({
        get: (key) =>
          requestResult<T | undefined>(database.transaction(options.storeName).objectStore().get(key) as IdbRequestLike<T | undefined>),
        set: async (key, value) => {
          database.transaction(options.storeName).objectStore().put(value, key)
        },
        delete: async (key) => {
          database.transaction(options.storeName).objectStore().delete(key)
        },
        keys: async () => {
          const keys = await requestResult<unknown[]>(database.transaction(options.storeName).objectStore().getAllKeys())
          return keys.map(String)
        }
      })
    }
  })
}

function requestResult<T>(request: IdbRequestLike<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = (): void => resolve(request.result)
    request.onerror = (): void => reject(new Error('IndexedDB request failed'))
  })
}
