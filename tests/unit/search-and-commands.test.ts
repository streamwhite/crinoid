import { describe, expect, it, vi } from 'vitest'
import { createCommandRegistry } from 'crinoid/command-palette'
import { fuzzyScore, rankBy } from 'crinoid/search'

describe('fuzzy search', () => {
  it('matches subsequences and rejects non-matches', () => {
    expect(fuzzyScore('opn', 'Open File')).toBeGreaterThan(0)
    expect(fuzzyScore('xyz', 'Open File')).toBe(-1)
    expect(fuzzyScore('', 'Open File')).toBe(0)
  })

  it('scores consecutive matches higher than scattered ones', () => {
    expect(fuzzyScore('open', 'open file')).toBeGreaterThan(fuzzyScore('open', 'o-p-e-n'))
  })

  it('ranks matching items and honors the limit', () => {
    const items = [
      { title: 'Save File' },
      { title: 'Open File' },
      { title: 'Open Folder' },
      { title: 'Quit' }
    ]

    expect(rankBy(items, 'open', { keys: ['title'] }).map((item) => item.title)).toEqual(['Open File', 'Open Folder'])
    expect(rankBy(items, 'o', { keys: ['title'], limit: 2 })).toHaveLength(2)
    expect(rankBy(items, '', { keys: ['title'] })).toHaveLength(4)
  })
})

describe('command registry', () => {
  it('registers, searches, and runs commands', async () => {
    const run = vi.fn()
    const registry = createCommandRegistry([
      { id: 'open', title: 'Open File', keywords: ['document'], run },
      { id: 'theme', title: 'Toggle Theme', group: 'View', run: () => {} }
    ])

    expect(registry.list()).toHaveLength(2)
    expect(registry.search('doc').map((command) => command.id)).toEqual(['open'])
    await expect(registry.run('open')).resolves.toBe(true)
    expect(run).toHaveBeenCalledTimes(1)
    await expect(registry.run('missing')).resolves.toBe(false)
  })

  it('unregisters commands and disposes returned by register', () => {
    const registry = createCommandRegistry()
    const dispose = registry.register({ id: 'a', title: 'Alpha', run: () => {} })

    expect(registry.list()).toHaveLength(1)
    dispose()
    expect(registry.list()).toHaveLength(0)
  })
})
