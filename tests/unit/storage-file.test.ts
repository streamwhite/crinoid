import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createFileStorage, removeStorage } from 'crinoid/storage'

const directories: string[] = []

async function scratch(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'crinoid-storage-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('file storage', () => {
  it('persists a typed map across instances and creates missing directories', async () => {
    const file = join(await scratch(), 'nested', 'state.json')
    const first = createFileStorage<{ theme: string }>(file)

    await first.set('preferences', { theme: 'dark' })

    await expect(first.get('missing')).resolves.toBeNull()
    expect(await first.keys?.()).toEqual(['preferences'])

    const second = createFileStorage<{ theme: string }>(file)
    await expect(second.get('preferences')).resolves.toEqual({ theme: 'dark' })
  })

  it('removes individual keys and reports the remaining keys', async () => {
    const file = join(await scratch(), 'state.json')
    const storage = createFileStorage<number>(file)

    await storage.set('a', 1)
    await storage.set('b', 2)
    await storage.remove('a')

    expect(await storage.keys?.()).toEqual(['b'])
    await expect(storage.get('a')).resolves.toBeNull()
    await expect(storage.get('b')).resolves.toBe(2)
  })

  it('falls back to an empty map for a missing or malformed file', async () => {
    const missing = createFileStorage<unknown>(join(await scratch(), 'absent.json'))
    expect(await missing.keys?.()).toEqual([])

    const file = join(await scratch(), 'broken.json')
    await writeFile(file, '{ not json', 'utf8')
    const broken = createFileStorage<unknown>(file)

    await expect(broken.get('anything')).resolves.toBeNull()
    expect(await broken.keys?.()).toEqual([])
  })

  it('removes the backing file', async () => {
    const file = join(await scratch(), 'state.json')
    await createFileStorage<number>(file).set('a', 1)

    await removeStorage(file)

    await expect(readFile(file, 'utf8')).rejects.toThrow()
  })
})
