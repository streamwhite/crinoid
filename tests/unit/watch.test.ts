import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNodeWatcher, watchPath } from 'crinoid/watch'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

function createFakeWatcherFactory() {
  let listener: (eventType: string, fileName: string | null) => void = () => {}
  let closed = false
  const close = vi.fn(() => {
    closed = true
  })
  return {
    factory: (_target: string, next: (eventType: string, fileName: string | null) => void) => {
      listener = next
      return { close } as never
    },
    emit: (eventType: string, fileName: string | null = null) => listener(eventType, fileName),
    isClosed: () => closed
  }
}

describe('file monitoring', () => {
  it('debounces events and forwards the latest one', async () => {
    const fake = createFakeWatcherFactory()
    const listener = vi.fn()
    watchPath('/tmp/target', listener, { debounceMs: 5, watch: fake.factory })

    fake.emit('change', 'a.txt')
    fake.emit('change', 'b.txt')
    expect(listener).not.toHaveBeenCalled()

    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1))
    expect(listener).toHaveBeenCalledWith({ type: 'change', fileName: 'b.txt' })
  })

  it('marks itself closed and releases the underlying watcher', async () => {
    const fake = createFakeWatcherFactory()
    const watcher = watchPath('/tmp/target', () => {}, { watch: fake.factory })

    await watcher.close()

    expect(watcher.isClosed()).toBe(true)
    expect(fake.isClosed()).toBe(true)
  })

  it('creates and closes a real node watcher', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'electron-template-watch-'))
    directories.push(directory)

    const watcher = createNodeWatcher(directory)
    watcher.close()
    expect(watcher).toBeDefined()
  })
})
