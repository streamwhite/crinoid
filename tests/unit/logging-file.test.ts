import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createRotatingFileSink } from 'crinoid/logging'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('rotating file sink', () => {
  it('writes records and rotates the log once the size limit is exceeded', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'electron-template-log-'))
    directories.push(directory)
    const filePath = join(directory, 'app.log')
    const sink = createRotatingFileSink({ filePath, maxBytes: 40, maxFiles: 2 })

    sink.write({ level: 'info', message: 'first', time: 't' })
    await sink.flush?.()
    sink.write({ level: 'info', message: 'second', time: 't' })
    await sink.flush?.()

    expect(await readFile(filePath, 'utf8')).toContain('second')
    expect(await readFile(`${filePath}.1`, 'utf8')).toContain('first')
  })
})
