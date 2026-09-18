import { app, BrowserWindow, clipboard, dialog, ipcMain, session, shell, type WebContents } from 'electron'
import { join } from 'node:path'
import { IPC_CHANNELS } from '@/shared/ipc/types'
import { isAllowedExternalUrl } from '@/main/security/external-url'
import { isTrustedSender } from '@/main/security/sender'
import { logger } from '@/main/logging/logger'
import { registerApplicationMenu } from '@/main/native/menu'
import { acquireSingleInstance } from '@/main/native/single-instance'
import { registerPermissionPolicy } from '@/main/security/permissions'
import { loadWindowState, saveWindowState, type WindowState } from '@/main/windows/state'
import { configureDeepLink, registerDeepLink } from '@/main/protocol/register'
import { features } from '@/config/features'
import { createElectronUpdateService } from '@/main/update/electron'

const APP_ORIGIN = 'file:'
const CURRENT_DIRECTORY = __dirname
const DEV_SERVER_URL = process.env.MAIN_WINDOW_VITE_DEV_SERVER_URL
const WINDOW_NAME = process.env.MAIN_WINDOW_VITE_NAME ?? 'main_window'

async function createWindow(): Promise<BrowserWindow> {
  const statePath = join(app.getPath('userData'), 'window-state.json')
  const state = await loadWindowState(statePath)
  const window = new BrowserWindow({
    width: state.width,
    height: state.height,
    ...(state.x === undefined ? {} : { x: state.x }),
    ...(state.y === undefined ? {} : { y: state.y }),
    webPreferences: { preload: join(CURRENT_DIRECTORY, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  })
  window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(APP_ORIGIN)) event.preventDefault() })
  window.webContents.setWindowOpenHandler(({ url }) => { if (isAllowedExternalUrl(url)) void shell.openExternal(url); return { action: 'deny' } })
  if (state.isMaximized) window.maximize()
  const persistState = () => { const [width = state.width, height = state.height] = window.getSize(); const [x, y] = window.getPosition(); const next: WindowState = { width, height, ...(x === undefined ? {} : { x }), ...(y === undefined ? {} : { y }), isMaximized: window.isMaximized() }; void saveWindowState(statePath, next) }
  window.on('resize', persistState)
  window.on('move', persistState)
  const page = DEV_SERVER_URL ? window.loadURL(DEV_SERVER_URL) : window.loadFile(join(CURRENT_DIRECTORY, `../renderer/${WINDOW_NAME}/index.html`))
  void page
  return window
}

function registerIpc(): void {
  const isTrusted = (event: { sender: WebContents }): boolean => isTrustedSender({ url: event.sender.getURL() }, APP_ORIGIN)
  ipcMain.handle(IPC_CHANNELS.getVersion, (event) => { if (!isTrusted(event)) throw new Error('Untrusted IPC sender'); return app.getVersion() })
  ipcMain.on(IPC_CHANNELS.minimize, (event) => { if (isTrusted(event)) BrowserWindow.fromWebContents(event.sender)?.minimize() })
  ipcMain.on(IPC_CHANNELS.maximize, (event) => { if (!isTrusted(event)) return; const window = BrowserWindow.fromWebContents(event.sender); if (window) window.isMaximized() ? window.unmaximize() : window.maximize() })
  ipcMain.on(IPC_CHANNELS.close, (event) => { if (isTrusted(event)) BrowserWindow.fromWebContents(event.sender)?.close() })
  ipcMain.handle(IPC_CHANNELS.openExternal, async (event, url: unknown) => { if (isTrusted(event) && typeof url === 'string' && isAllowedExternalUrl(url)) { await shell.openExternal(url); return true } return false })
  ipcMain.handle(IPC_CHANNELS.openFile, async (event) => { if (!isTrusted(event)) return null; const window = BrowserWindow.fromWebContents(event.sender); if (!window) return null; const result = await dialog.showOpenDialog(window, { properties: ['openFile'] }); return result.canceled ? null : result.filePaths[0] ?? null })
  ipcMain.handle(IPC_CHANNELS.readClipboard, (event) => isTrusted(event) ? clipboard.readText() : '')
  ipcMain.handle(IPC_CHANNELS.writeClipboard, (event, value: unknown) => { if (isTrusted(event) && typeof value === 'string') clipboard.writeText(value) })
}

if (acquireSingleInstance((commandLine) => { logger.info('Second application launch received'); registerDeepLink(commandLine.find((argument) => argument.startsWith('myapp:'))) })) {
  process.on('uncaughtException', (error) => logger.error('Uncaught exception', { message: error.message }))
  process.on('unhandledRejection', (error: unknown) => logger.error('Unhandled rejection', { message: error instanceof Error ? error.message : 'Unknown error' }))
  app.on('open-url', (event, url) => { event.preventDefault(); registerDeepLink(url) })
  app.whenReady().then(async () => { registerPermissionPolicy(session.defaultSession); await createWindow(); registerIpc(); registerApplicationMenu(); if (features.deepLink) configureDeepLink(); if (features.autoUpdate) void createElectronUpdateService().check().catch((error: unknown) => logger.warn('Update check failed', { message: error instanceof Error ? error.message : 'Unknown error' })); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow() }) }).catch((error: unknown) => { logger.error('Failed to start application', { message: error instanceof Error ? error.message : 'Unknown error' }); app.quit() })
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
