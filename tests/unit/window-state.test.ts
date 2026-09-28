import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_WINDOW_STATE, loadWindowState, saveWindowState } from 'crinoid/window'

const directories: string[] = []

async function scratch(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'crinoid-window-'))
  directories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('window state persistence', () => {
  it('round-trips state and creates missing directories', async () => {
    const file = join(await scratch(), 'nested', 'window-state.json')
    const state = { width: 900, height: 600, x: 20, y: 30, isMaximized: true, isFullScreen: false }

    await saveWindowState(file, state)

    await expect(loadWindowState(file)).resolves.toEqual(state)
    await expect(readFile(file, 'utf8')).resolves.toContain('"width": 900')
  })

  it('falls back to defaults for a missing file', async () => {
    await expect(loadWindowState(join(await scratch(), 'absent.json'))).resolves.toEqual(DEFAULT_WINDOW_STATE)
  })

  it('merges partial stored files over the defaults', async () => {
    const file = join(await scratch(), 'partial.json')
    await writeFile(file, JSON.stringify({ width: 500 }), 'utf8')

    await expect(loadWindowState(file)).resolves.toEqual({ ...DEFAULT_WINDOW_STATE, width: 500 })
  })

  it('falls back to defaults for malformed json', async () => {
    const file = join(await scratch(), 'broken.json')
    await writeFile(file, '{ not json', 'utf8')

    await expect(loadWindowState(file)).resolves.toEqual(DEFAULT_WINDOW_STATE)
  })
})
