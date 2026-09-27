import { describe, expect, it, vi } from 'vitest'
import { createDataTransfer } from 'crinoid/data-transfer'
import { createKeyValueStorage } from 'crinoid/storage'
import { createMemoryStorage } from 'crinoid/storage'

describe('data transfer', () => {
  it('exports a versioned snapshot of the storage', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    await kv.set('theme', 'dark')
    await kv.set('count', 2)
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 3 })

    const snapshot = await transfer.export()

    expect(snapshot.version).toBe(3)
    expect(snapshot.data['ns:theme']).toBe('dark')
  })

  it('imports a snapshot with merge by default', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    await kv.set('theme', 'dark')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })

    await transfer.import({ version: 1, data: { 'ns:count': 5 } })

    expect(await kv.get('theme')).toBe('dark')
    expect(await kv.get('count')).toBe(5)
  })

  it('replaces existing data when requested', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    await kv.set('theme', 'dark')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })

    await transfer.import({ version: 1, data: { 'ns:count': 5 } }, { mode: 'replace' })

    expect(await kv.get('theme')).toBeNull()
    expect(await kv.get('count')).toBe(5)
  })

  it('rejects snapshots with a newer major version', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })

    await expect(transfer.import({ version: 99, data: {} })).rejects.toThrow('version')
  })

  it('creates a backup and restores it', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    await kv.set('theme', 'dark')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })
    const written: string[] = []

    await transfer.backup({ write: async (contents) => {
      written.push(contents)
    } })
    await kv.remove('theme')
    const restored = await transfer.restore({ read: async () => written[0] ?? '' })

    expect(restored).toBe(true)
    expect(await kv.get('theme')).toBe('dark')
  })

  it('returns false when restore finds no backup', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })

    await expect(transfer.restore({ read: async () => null as unknown as string })).resolves.toBe(false)
  })
})

describe('data transfer validation', () => {
  it('ignores unrelated keys during import', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1 })

    await transfer.import({ version: 1, data: { other: 1, 'ns:kept': 2 } })

    expect(await kv.get('kept')).toBe(2)
  })

  it('reports progress while exporting large sets', async () => {
    const kv = createKeyValueStorage<unknown>(createMemoryStorage<unknown>(), 'ns')
    const onProgress = vi.fn()
    const transfer = createDataTransfer({ storage: kv, namespace: 'ns', version: 1, onProgress })

    await transfer.export()

    expect(onProgress).toHaveBeenCalled()
  })
})
