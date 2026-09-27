import { describe, expect, it, vi } from 'vitest'
import { createClipboardService, HTML_MIME_TYPE, IMAGE_MIME_TYPE } from 'crinoid/clipboard'

function createPort() {
  return {
    readText: vi.fn(async () => 'text'),
    writeText: vi.fn(async () => {}),
    readImage: vi.fn(async () => new Uint8Array([1, 2, 3])),
    writeImage: vi.fn(async () => {}),
    has: vi.fn(async () => true),
    clear: vi.fn()
  }
}

describe('clipboard service', () => {
  it('reads and writes text', async () => {
    const port = createPort()
    const clipboard = createClipboardService(port)

    await expect(clipboard.readText()).resolves.toBe('text')
    await clipboard.writeText('next')

    expect(port.writeText).toHaveBeenCalledWith('next')
  })

  it('reads and writes images', async () => {
    const port = createPort()
    const clipboard = createClipboardService(port)

    await expect(clipboard.readImage()).resolves.toEqual(new Uint8Array([1, 2, 3]))
    await clipboard.writeImage(new Uint8Array([9]))

    expect(port.writeImage).toHaveBeenCalledWith(new Uint8Array([9]))
  })

  it('checks for image and HTML content by mime type', async () => {
    const port = createPort()
    const clipboard = createClipboardService(port)

    await expect(clipboard.hasImage()).resolves.toBe(true)
    await expect(clipboard.hasHtml()).resolves.toBe(true)

    expect(port.has).toHaveBeenCalledWith(IMAGE_MIME_TYPE)
    expect(port.has).toHaveBeenCalledWith(HTML_MIME_TYPE)
  })

  it('clears the clipboard', () => {
    const port = createPort()
    createClipboardService(port).clear()
    expect(port.clear).toHaveBeenCalled()
  })
})
