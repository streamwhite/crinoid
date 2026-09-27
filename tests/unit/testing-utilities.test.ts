import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createChannel, createIpcRegistry } from 'crinoid/ipc'
import {
  createCollectingLogger,
  createDeferred,
  createElectronMock,
  createFakeIpcPair,
  createMainDeps,
  UNTRUSTED_RENDERER_URL,
  waitFor,
  withTempDir
} from 'crinoid/testing'

describe('fixtures', () => {
  it('resolves deferred promises', async () => {
    const deferred = createDeferred<number>()
    deferred.resolve(7)
    await expect(deferred.promise).resolves.toBe(7)
  })

  it('waits for a condition and times out', async () => {
    let ready = false
    setTimeout(() => {
      ready = true
    }, 5)
    await expect(waitFor(() => ready, { timeoutMs: 200, intervalMs: 2 })).resolves.toBeUndefined()
    await expect(waitFor(() => false, { timeoutMs: 20, intervalMs: 2 })).rejects.toThrow('timed out')
  })

  it('creates and cleans a temporary directory', async () => {
    let captured = ''
    await withTempDir(async (directory) => {
      captured = directory
      expect(existsSync(directory)).toBe(true)
    })
    expect(existsSync(captured)).toBe(false)
  })
})

describe('fake ipc', () => {
  const echo = createChannel<{ id: string }, string>(
    'feature.echo',
    (value): value is { id: string } => typeof (value as { id?: unknown })?.id === 'string'
  )

  it('routes renderer invocations to registered handlers', async () => {
    const { ipcMain, ipcRenderer } = createFakeIpcPair()
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: echo, handle: ({ request }) => request.id })

    await expect(ipcRenderer.invoke('feature.echo', { id: '1' })).resolves.toBe('1')
    await expect(ipcRenderer.invoke('feature.echo', {})).rejects.toThrow('Invalid')
    expect(ipcRenderer.calls[0]).toEqual({ channel: 'feature.echo', args: [{ id: '1' }] })
  })

  it('rejects invocations from an untrusted url', async () => {
    const { ipcMain, ipcRenderer } = createFakeIpcPair({ url: UNTRUSTED_RENDERER_URL })
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register({ channel: echo, handle: ({ request }) => request.id })

    await expect(ipcRenderer.invoke('feature.echo', { id: '1' })).rejects.toThrow('Untrusted')
  })
})

describe('electron mock', () => {
  it('models windows, dialogs, clipboard, shell, notifications, shortcuts, and secrets', async () => {
    const mock = createElectronMock()
    const window = new mock.BrowserWindow({ width: 800, height: 600 })
    window.focus()

    expect(mock.BrowserWindow.getAllWindows()).toEqual([window])
    expect(mock.BrowserWindow.getFocusedWindow()).toBe(window)

    window.webContents.send('topic', 1)
    expect(window.webContents.messages).toEqual([{ channel: 'topic', args: [1] }])

    mock.dialog.openResults.push({ canceled: false, filePaths: ['/a'] })
    await expect(mock.dialog.showOpenDialog(undefined, {})).resolves.toEqual({ canceled: false, filePaths: ['/a'] })

    mock.clipboard.writeText('hi')
    expect(mock.clipboard.readText()).toBe('hi')

    await mock.shell.openExternal('https://example.com')
    expect(mock.shell.openedExternal).toEqual(['https://example.com'])

    expect(mock.Notification.isSupported()).toBe(true)
    const notification = new mock.Notification({ title: 't', body: 'b' })
    notification.show()
    expect(notification.shown).toBe(true)

    expect(mock.globalShortcut.register('Cmd+K', () => {})).toBe(true)
    expect(mock.globalShortcut.isRegistered('Cmd+K')).toBe(true)
    expect(mock.globalShortcut.register('Cmd+K', () => {})).toBe(false)

    expect(mock.safeStorage.decryptString(mock.safeStorage.encryptString('secret'))).toBe('secret')
  })

  it('provides collection logger and injectable main deps', async () => {
    const { logger, records } = createCollectingLogger()
    logger.info('hello')
    expect(records[0]?.message).toBe('hello')

    const deps = createMainDeps()
    await deps.shell?.openExternal('https://example.com')
    expect(deps.logger).toBeDefined()
  })
})
