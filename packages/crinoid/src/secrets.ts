import type { Storage } from './storage.js'

export interface SecretStorePort {
  readonly storage: Storage<string>
  readonly isEncryptionAvailable: () => boolean
  readonly encryptString: (value: string) => Buffer
  readonly decryptString: (value: Buffer) => string
}

export interface SecretStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  has(key: string): Promise<boolean>
  remove(key: string): Promise<void>
}

export function createSecretStore(port: SecretStorePort): SecretStore {
  const assertAvailable = (): void => {
    if (!port.isEncryptionAvailable()) throw new Error('OS encryption is not available')
  }

  return {
    get: async (key) => {
      assertAvailable()
      const encoded = await port.storage.get(key)
      if (encoded === null) return null
      try {
        return port.decryptString(Buffer.from(encoded, 'base64'))
      } catch {
        return null
      }
    },
    set: async (key, value) => {
      assertAvailable()
      await port.storage.set(key, port.encryptString(value).toString('base64'))
    },
    has: async (key) => (await port.storage.get(key)) !== null,
    remove: (key) => port.storage.remove(key)
  }
}
