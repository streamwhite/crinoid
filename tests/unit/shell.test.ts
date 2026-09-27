import { describe, expect, it, vi } from 'vitest'
import { createShellService } from 'crinoid/shell'

function createPort() {
  return {
    openExternal: vi.fn(async () => {}),
    openPath: vi.fn(async () => ''),
    showItemInFolder: vi.fn(),
    trashItem: vi.fn(async () => {})
  }
}

describe('shell service', () => {
  it('opens allowed external URLs', async () => {
    const port = createPort()
    const shell = createShellService(port)

    await expect(shell.openExternal('https://example.com')).resolves.toBe(true)
    expect(port.openExternal).toHaveBeenCalledWith('https://example.com')
  })

  it('blocks disallowed protocols', async () => {
    const port = createPort()
    const shell = createShellService(port)

    await expect(shell.openExternal('javascript:alert(1)')).resolves.toBe(false)
    expect(port.openExternal).not.toHaveBeenCalled()
  })

  it('opens a path and reports errors as a string', async () => {
    const port = createPort()
    port.openPath.mockResolvedValueOnce('No such file')

    await expect(createShellService(port).openPath('/tmp/missing')).resolves.toBe('No such file')
  })

  it('reveals an item and moves it to trash', async () => {
    const port = createPort()
    const shell = createShellService(port)

    shell.showItemInFolder('/tmp/a.txt')
    await shell.trashItem('/tmp/a.txt')

    expect(port.showItemInFolder).toHaveBeenCalledWith('/tmp/a.txt')
    expect(port.trashItem).toHaveBeenCalledWith('/tmp/a.txt')
  })
})
