import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCollectingLogger, createElectronMock, waitFor } from 'crinoid/testing'
import type { ElectronMock, MockWindow } from 'crinoid/testing'
import { createDesktopConfig } from 'crinoid/config'
import { saveWindowState } from 'crinoid/window'

type FullMock = ElectronMock & {
  ClipboardItem: new (data: unknown) => unknown
  session: {
    defaultSession: {
      webRequest: { onHeadersReceived: (...args: unknown[]) => void }
      on: (...args: unknown[]) => void
      downloadURL: (...args: unknown[]) => void
    }
  }
}

const directories: string[] = []

afterEach(async () => {
  vi.doUnmock('electron')
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

async function load(): Promise<{
  electron: FullMock
  headers: () => unknown
  createMainProcess: typeof import('crinoid/main').createMainProcess
  createDesktopWindow: typeof import('crinoid/main').createDesktopWindow
  createChildWindow: typeof import('crinoid/main').createChildWindow
}> {
  vi.resetModules()
  const base = createElectronMock()
  let headersListener: unknown
  const session = {
    defaultSession: {
      setPermissionRequestHandler: () => {},
      setPermissionCheckHandler: () => {},
      webRequest: {
        onHeadersReceived: (listener: unknown) => {
          headersListener = listener
        }
      },
      on: () => {},
      downloadURL: () => {}
    }
  }
  const electron = { ...base, ClipboardItem: class {}, session } as unknown as FullMock
  vi.doMock('electron', () => electron)

  const main = await import('crinoid/main')
  return {
    electron,
    headers: () => headersListener,
    createMainProcess: main.createMainProcess,
    createDesktopWindow: main.createDesktopWindow,
    createChildWindow: main.createChildWindow
  }
}

describe('desktop window creation', () => {
  it('applies secure web preferences and the preload path', async () => {
    const { createDesktopWindow } = await load()

    const window = (await createDesktopWindow({ preloadPath: '/app/preload.js', rendererFile: '/app/index.html' })) as unknown as MockWindow

    expect(window.options.webPreferences).toMatchObject({
      preload: '/app/preload.js',
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    })
  })

  it('restores persisted size and position from disk', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'crinoid-main-'))
    directories.push(directory)
    const statePath = join(directory, 'window-state.json')
    await saveWindowState(statePath, { width: 640, height: 480, x: 10, y: 20, isMaximized: false, isFullScreen: false })

    const { createDesktopWindow } = await load()
    const window = (await createDesktopWindow({ preloadPath: '/p.js', rendererFile: '/i.html', statePath })) as unknown as MockWindow

    expect(window.options).toMatchObject({ width: 640, height: 480, x: 10, y: 20 })
  })

  it('binds a child window to its parent', async () => {
    const { createDesktopWindow, createChildWindow } = await load()
    const parent = (await createDesktopWindow({ preloadPath: '/p.js', rendererFile: '/i.html' })) as unknown as MockWindow

    const child = createChildWindow(parent as never, {
      preloadPath: '/p.js',
      rendererFile: '/child.html',
      modal: true
    }) as unknown as MockWindow

    expect(child.options.parent).toBe(parent)
    expect(child.options.modal).toBe(true)
  })

  it('blocks navigation away from the app origin and denies new windows', async () => {
    const { electron, createDesktopWindow } = await load()
    const window = (await createDesktopWindow({ preloadPath: '/p.js', rendererFile: '/i.html' })) as unknown as MockWindow

    const blocked = { preventDefault: vi.fn() }
    window.webContents.emit('will-navigate', blocked, 'https://evil.example')
    expect(blocked.preventDefault).toHaveBeenCalledTimes(1)

    const allowed = { preventDefault: vi.fn() }
    window.webContents.emit('will-navigate', allowed, 'file:///app/index.html')
    expect(allowed.preventDefault).not.toHaveBeenCalled()

    expect(window.webContents.windowOpenHandler?.({ url: 'https://example.com' })).toEqual({ action: 'deny' })
    expect(window.webContents.windowOpenHandler?.({ url: 'javascript:alert(1)' })).toEqual({ action: 'deny' })
    expect(electron.shell.openedExternal).toEqual(['https://example.com'])
  })
})

describe('main process composition', () => {
  it('opens the main window, installs the CSP, and registers desktop IPC on ready', async () => {
    const { electron, headers, createMainProcess } = await load()
    createMainProcess({
      config: createDesktopConfig({ appName: 'Test App' }),
      window: { preloadPath: '/app/preload.js', rendererFile: '/app/index.html' },
      deps: { logger: createCollectingLogger().logger }
    })

    electron.app.emit('ready')
    await waitFor(() => electron.ipcMain.handlers.has('app.get-version'))

    const window = electron.BrowserWindow.getAllWindows()[0]
    expect(window?.options.webPreferences).toMatchObject({
      preload: '/app/preload.js',
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    })
    expect(electron.ipcMain.handlers.has('window.open')).toBe(true)
    expect(electron.ipcMain.handlers.has('auth.login')).toBe(false)
    expect(headers()).toBeTypeOf('function')
  })

  it('enforces the external url allowlist through IPC', async () => {
    const { electron, createMainProcess } = await load()
    createMainProcess({
      config: createDesktopConfig({ appName: 'App' }),
      window: { preloadPath: '/p.js', rendererFile: '/i.html' },
      deps: { logger: createCollectingLogger().logger }
    })

    electron.app.emit('ready')
    await waitFor(() => electron.ipcMain.handlers.has('shell.open-external'))

    const event = { sender: { getURL: () => 'file:///app/index.html' } }
    await expect(electron.ipcMain.invoke('shell.open-external', event, 'https://example.com')).resolves.toBe(true)
    await expect(electron.ipcMain.invoke('shell.open-external', event, 'javascript:alert(1)')).resolves.toBe(false)

    expect(electron.shell.openedExternal).toEqual(['https://example.com'])
  })

  it('registers optional auth channels only when a bridge is provided', async () => {
    const { electron, createMainProcess } = await load()
    const sessionManager = {
      login: async () => null,
      logout: async () => {},
      restore: async () => null,
      current: () => null,
      subscribe: () => () => {}
    }

    createMainProcess({
      config: createDesktopConfig({ appName: 'App' }),
      window: { preloadPath: '/p.js', rendererFile: '/i.html' },
      auth: { sessionManager },
      deps: { logger: createCollectingLogger().logger }
    })

    electron.app.emit('ready')
    await waitFor(() => electron.ipcMain.handlers.has('auth.login'))

    expect(electron.ipcMain.handlers.has('auth.session')).toBe(true)
  })

  it('opens a named child window once and reuses it on repeat opens', async () => {
    const { electron, createMainProcess } = await load()
    createMainProcess({
      config: createDesktopConfig({ appName: 'App' }),
      window: { preloadPath: '/p.js', rendererFile: '/i.html' },
      childWindows: { about: { preloadPath: '/p.js', rendererFile: '/about.html' } },
      deps: { logger: createCollectingLogger().logger }
    })

    electron.app.emit('ready')
    await waitFor(() => electron.ipcMain.handlers.has('window.open'))

    const event = { sender: { getURL: () => 'file:///app/index.html' } }
    const before = electron.BrowserWindow.getAllWindows().length

    await expect(electron.ipcMain.invoke('window.open', event, 'about')).resolves.toBe(true)
    await expect(electron.ipcMain.invoke('window.open', event, 'about')).resolves.toBe(true)
    await expect(electron.ipcMain.invoke('window.open', event, 'missing')).resolves.toBe(false)

    expect(electron.BrowserWindow.getAllWindows().length).toBe(before + 1)
  })
})
