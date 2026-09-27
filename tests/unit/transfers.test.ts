import { describe, expect, it, vi } from 'vitest'
import { createTransferManager } from 'crinoid/transfers'

function createDownloadItem() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  return {
    getFilename: () => 'file.bin',
    getURL: () => 'https://example.com/file.bin',
    getTotalBytes: () => 100,
    getReceivedBytes: () => 40,
    setSavePath: vi.fn(),
    cancel: vi.fn(),
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const set = listeners.get(event) ?? new Set()
      set.add(listener)
      listeners.set(event, set)
    }),
    emit: (event: string, ...args: unknown[]) => {
      for (const listener of listeners.get(event) ?? []) listener(...args)
    }
  }
}

function createSession() {
  let handler: ((event: unknown, item: ReturnType<typeof createDownloadItem>) => void) | null = null
  return {
    on: vi.fn((_event: string, listener: typeof handler) => {
      handler = listener
    }),
    downloadURL: vi.fn(),
    emit: (item: ReturnType<typeof createDownloadItem>) => handler?.(null, item)
  }
}

describe('transfer manager', () => {
  it('starts a download and reports progress', () => {
    const session = createSession()
    const onProgress = vi.fn()
    const manager = createTransferManager({ session, onProgress })

    manager.download('https://example.com/file.bin')
    const item = createDownloadItem()
    session.emit(item)
    item.emit('updated')

    expect(session.downloadURL).toHaveBeenCalledWith('https://example.com/file.bin')
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ receivedBytes: 40, totalBytes: 100, progress: 0.4 }))
  })

  it('reports completion', () => {
    const session = createSession()
    const onDone = vi.fn()
    const manager = createTransferManager({ session, onDone })

    manager.download('https://example.com/file.bin')
    const item = createDownloadItem()
    session.emit(item)
    item.emit('done', null, 'completed')

    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ state: 'completed', filename: 'file.bin' }))
  })

  it('exposes an upload lifecycle with progress', () => {
    const session = createSession()
    const onProgress = vi.fn()
    const manager = createTransferManager({ session, onProgress })
    const upload = manager.createUpload('https://example.com/upload')

    upload.start()
    upload.progress(30, 60)

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ direction: 'upload', receivedBytes: 30, totalBytes: 60 }))
  })

  it('cancels tracked transfers', () => {
    const session = createSession()
    const manager = createTransferManager({ session })
    manager.download('https://example.com/file.bin')
    const item = createDownloadItem()
    session.emit(item)

    manager.cancelAll()

    expect(item.cancel).toHaveBeenCalled()
  })
})
