import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { copyPath, ensureDirectory, fileExists, listDirectory, movePath, readJson, readText, removePath, writeJson, writeText } from 'crinoid/fs'

const directories: string[] = []

async function scratch(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'electron-template-fs-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('file system operations', () => {
  it('writes, reads, and checks files', async () => {
    const directory = await scratch()
    const file = join(directory, 'note.txt')

    await writeText(file, 'hello')
    expect(await readText(file)).toBe('hello')
    expect(await fileExists(file)).toBe(true)
    expect(await fileExists(join(directory, 'missing.txt'))).toBe(false)
  })

  it('round-trips JSON values', async () => {
    const directory = await scratch()
    const file = join(directory, 'data.json')

    await writeJson(file, { count: 2 })
    expect(await readJson<{ count: number }>(file)).toEqual({ count: 2 })
  })

  it('copies and moves paths', async () => {
    const directory = await scratch()
    const source = join(directory, 'source.txt')
    const copy = join(directory, 'copy.txt')
    const moved = join(directory, 'moved.txt')

    await writeText(source, 'payload')
    await copyPath(source, copy)
    await movePath(copy, moved)

    expect(await readText(moved)).toBe('payload')
    expect(await fileExists(copy)).toBe(false)
  })

  it('creates directories, lists them, and removes recursively', async () => {
    const directory = await scratch()
    await ensureDirectory(join(directory, 'nested'))
    await writeText(join(directory, 'nested', 'a.txt'), 'a')
    await writeText(join(directory, 'root.txt'), 'r')

    const entries = await listDirectory(directory)
    expect(entries.map((entry) => entry.name).sort()).toEqual(['nested', 'root.txt'])
    expect(entries.find((entry) => entry.name === 'nested')?.isDirectory).toBe(true)

    await removePath(directory)
    expect(await fileExists(directory)).toBe(false)
  })

  it('reads a file through provided dependencies', async () => {
    const directory = await scratch()
    const file = join(directory, 'raw.txt')
    await writeFile(file, 'raw', 'utf8')

    expect(await readFile(file, 'utf8')).toBe('raw')
  })
})
