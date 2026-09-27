import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readTextStream, writeTextStream } from 'crinoid/stream'

const directories: string[] = []

async function scratch(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'electron-template-stream-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('streaming file access', () => {
  it('writes and reads a large file in chunks', async () => {
    const directory = await scratch()
    const file = join(directory, 'large.txt')
    const chunks = ['alpha', 'beta', 'gamma']
    const progress: number[] = []

    await writeTextStream(file, chunks, { onProgress: (written) => progress.push(written) })
    const content = await readTextStream(file, { onProgress: () => {} })

    expect(content).toBe('alphabetagamma')
    expect(progress.at(-1)).toBe('alphabetagamma'.length)
  })

  it('reports read progress against the file size', async () => {
    const directory = await scratch()
    const file = join(directory, 'read.txt')
    await writeFile(file, 'abcdef', 'utf8')

    const progress: number[] = []
    await readTextStream(file, { onProgress: (bytes) => progress.push(bytes) })

    expect(progress.at(-1)).toBe(6)
  })
})
