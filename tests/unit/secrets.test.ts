import { describe, expect, it, vi } from 'vitest'
import { createSecretStore } from 'crinoid/secrets'
import type { Storage } from 'crinoid/storage'

function createStorage() {
  const values = new Map<string, string>()
  return {
    values,
    storage: {
      get: async (key: string) => values.get(key) ?? null,
      set: async (key: string, value: string) => {
        values.set(key, value)
      },
      remove: async (key: string) => {
        values.delete(key)
      }
    } as Storage<string>
  }
}

describe('secret store', () => {
  it('encrypts on write and decrypts on read', async () => {
    const { storage, values } = createStorage()
    const encryptString = vi.fn((value: string) => Buffer.from(`enc:${value}`))
    const decryptString = vi.fn((value: Buffer) => value.toString().replace('enc:', ''))
    const secrets = createSecretStore({ storage, isEncryptionAvailable: () => true, encryptString, decryptString })

    await secrets.set('token', 's3cret')

    expect(values.get('token')).not.toContain('s3cret')
    await expect(secrets.get('token')).resolves.toBe('s3cret')
  })

  it('returns null for a missing secret', async () => {
    const { storage } = createStorage()
    const secrets = createSecretStore({
      storage,
      isEncryptionAvailable: () => true,
      encryptString: () => Buffer.from('x'),
      decryptString: () => 'x'
    })

    await expect(secrets.get('missing')).resolves.toBeNull()
  })

  it('throws when OS encryption is unavailable', async () => {
    const { storage } = createStorage()
    const secrets = createSecretStore({
      storage,
      isEncryptionAvailable: () => false,
      encryptString: () => Buffer.from('x'),
      decryptString: () => 'x'
    })

    await expect(secrets.set('token', 'value')).rejects.toThrow('encryption')
  })

  it('removes and lists stored keys', async () => {
    const { storage } = createStorage()
    const secrets = createSecretStore({
      storage,
      isEncryptionAvailable: () => true,
      encryptString: (value) => Buffer.from(value),
      decryptString: (value) => value.toString()
    })

    await secrets.set('a', '1')
    await secrets.set('b', '2')
    await secrets.remove('a')

    await expect(secrets.has('a')).resolves.toBe(false)
    await expect(secrets.has('b')).resolves.toBe(true)
  })
})
