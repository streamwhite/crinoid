import { describe, expect, it, vi } from 'vitest'
import { createDialogService, isConfirmDialogOptions, isSaveDialogRequest } from 'crinoid/dialogs'

function createPort(overrides: Record<string, unknown> = {}) {
  return {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/tmp/a.txt'] }),
    showSaveDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '/tmp/out.txt' }),
    showMessageBox: vi.fn().mockResolvedValue({ response: 0 }),
    ...overrides
  }
}

describe('dialog service', () => {
  it('opens a single file and forwards options', async () => {
    const port = createPort()
    const service = createDialogService({ dialog: port })

    await expect(service.openFile({ title: 'Pick' })).resolves.toBe('/tmp/a.txt')
    expect(port.showOpenDialog).toHaveBeenCalledWith(undefined, { properties: ['openFile'], title: 'Pick' })
  })

  it('returns null when the open dialog is canceled', async () => {
    const port = createPort({ showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] }) })

    await expect(createDialogService({ dialog: port }).openFile()).resolves.toBeNull()
  })

  it('returns every selected file', async () => {
    const port = createPort({ showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: ['/a', '/b'] }) })

    await expect(createDialogService({ dialog: port }).openFiles()).resolves.toEqual(['/a', '/b'])
  })

  it('uses the parent window when available', async () => {
    const port = createPort()
    const target = { id: 1 }

    await createDialogService({ dialog: port, resolveWindow: () => target }).openDirectory()

    expect(port.showOpenDialog).toHaveBeenCalledWith(target, { properties: ['openDirectory'] })
  })

  it('saves to a path and returns null when canceled', async () => {
    const port = createPort()
    await expect(createDialogService({ dialog: port }).saveFile({ defaultPath: '/tmp' })).resolves.toBe('/tmp/out.txt')
    expect(port.showSaveDialog).toHaveBeenCalledWith(undefined, { defaultPath: '/tmp' })

    const canceled = createPort({ showSaveDialog: vi.fn().mockResolvedValue({ canceled: true }) })
    await expect(createDialogService({ dialog: canceled }).saveFile()).resolves.toBeNull()
  })

  it('resolves confirm from the first button', async () => {
    const port = createPort()
    const options = { message: 'Delete?', confirmLabel: 'Delete', cancelLabel: 'Keep' }

    await expect(createDialogService({ dialog: port }).confirm(options)).resolves.toBe(true)
    expect(port.showMessageBox).toHaveBeenCalledWith(undefined, expect.objectContaining({ buttons: ['Delete', 'Keep'], message: 'Delete?' }))

    const denied = createPort({ showMessageBox: vi.fn().mockResolvedValue({ response: 1 }) })
    await expect(createDialogService({ dialog: denied }).confirm(options)).resolves.toBe(false)
  })
})

describe('dialog request validation', () => {
  it('accepts optional save paths', () => {
    expect(isSaveDialogRequest({})).toBe(true)
    expect(isSaveDialogRequest({ defaultPath: '/tmp' })).toBe(true)
    expect(isSaveDialogRequest({ defaultPath: 1 })).toBe(false)
    expect(isSaveDialogRequest(null)).toBe(false)
  })

  it('requires confirm labels and a valid type', () => {
    expect(isConfirmDialogOptions({ message: 'm', confirmLabel: 'y', cancelLabel: 'n' })).toBe(true)
    expect(isConfirmDialogOptions({ message: 'm', confirmLabel: 'y' })).toBe(false)
    expect(isConfirmDialogOptions({ message: 'm', confirmLabel: 'y', cancelLabel: 'n', type: 'nope' })).toBe(false)
  })
})
