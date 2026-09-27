import {
  app,
  BrowserWindow,
  clipboard,
  ClipboardItem,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  Notification,
  powerMonitor,
  safeStorage,
  screen,
  session,
  shell,
  Tray,
  type BrowserWindowConstructorOptions,
  type Dock,
  type MessageBoxOptions,
  type OpenDialogOptions,
  type SaveDialogOptions,
  type Session,
  type WebContents
} from 'electron'
import { join } from 'node:path'
import { cpus, freemem as freeMemory, hostname, release, totalmem as totalMemory, uptime } from 'node:os'
import { DESKTOP_CHANNELS, createIpcRegistry } from './ipc.js'
import { isAllowedExternalUrl, isPermissionAllowed, isTrustedSender } from './security.js'
import { levelFromEnvironment, type Logger } from './logging.js'
import { createObservability, type Observability, type ObservabilityOptions } from './observability.js'
import { createSingleInstance, type SingleInstanceApp } from './single-instance.js'
import { createAutoLaunch, type AutoLaunchOptions } from './auto-launch.js'
import { findDeepLinkArgument } from './deep-link.js'
import { resolveEnvironment, type EnvironmentSource } from './environment.js'
import { installGlobalErrorHandlers, type ErrorEventSource, type ErrorScope } from './errors.js'
import { createAppLifecycle, createShutdownManager, type AppEventTarget } from './lifecycle.js'
import {
  DEFAULT_WINDOW_STATE,
  createWindowRegistry,
  ensureVisibleOnDisplays,
  loadWindowState,
  saveWindowState,
  type DisplayWorkArea,
  type WindowBounds,
  type WindowChromeOptions,
  type WindowState
} from './window.js'
import { createDialogService, type DialogPort, type DialogService } from './dialogs.js'
import { createShortcutManager, type GlobalShortcutPort, type ShortcutAction } from './shortcuts.js'
import { createTrayController, type TrayLabels, type TrayPort, type TrayWindow } from './tray.js'
import { createMenuService, defaultApplicationMenuTemplate, type MenuItemTemplate, type MenuPort } from './menu.js'
import { createContextMenuHandler, type ContextMenuHandler } from './context-menu.js'
import { createPlatformIntegration, type DockPort, type PlatformIntegration, type TaskbarPort } from './integration.js'
import { createStore, type Store } from './reactive.js'
import { createStateSync, type StateSync } from './state-sync.js'
import { createRecentItems, type RecentItems } from './recent-items.js'
import { copyPath, ensureDirectory, fileExists, listDirectory, movePath, readJson, readText, removePath, writeJson, writeText } from './fs.js'
import { detectMimeType } from './mime.js'
import { watchPath, type Watcher } from './watch.js'
import { createClipboardService, IMAGE_MIME_TYPE, type ClipboardService } from './clipboard.js'
import { createNotificationService, type NotificationService } from './notifications.js'
import { createShellService } from './shell.js'
import { collectSystemInfo, type SystemInfo } from './system.js'
import { readBatteryStatus, createPowerMonitor, type BatteryStatus } from './power.js'
import { readNetworkStatus, type NetworkStatus } from './network.js'
import { createSecretStore, type SecretStore } from './secrets.js'
import { createTransferManager, type TransferManager, type TransferProgress } from './transfers.js'
import { createUpdateService, resolveChannel, type ReleaseChannel, type UpdateAdapter, type UpdateService } from './tasks.js'
import { applyProxy, type ProxyConfigInput } from './proxy.js'
import { installContentSecurityPolicy } from './security.js'
import { createFileStorage } from './storage.js'
import type { DesktopConfig } from './config.js'

export interface DesktopMainDeps {
  shell?: { openExternal(url: string): Promise<void> }
  dialog?: DialogPort
  clipboard?: { readText(): string; writeText(value: string): void }
  tray?: TrayPort
  menu?: MenuPort
  shortcuts?: GlobalShortcutPort
  taskbar?: TaskbarPort
  dock?: DockPort
  logger?: Logger
}

export interface DesktopWindowOptions {
  preloadPath: string
  rendererFile: string
  devServerUrl?: string
  width?: number
  height?: number
  statePath?: string
  parent?: BrowserWindow
  modal?: boolean
  chrome?: WindowChromeOptions
}

export interface TrayOptions {
  readonly iconPath: string
  readonly tooltip: string
  readonly labels: TrayLabels
  readonly minimizeToTray?: boolean
  readonly closeToTray?: boolean
}

export interface StateOptions<T = unknown> {
  readonly initial: T
  readonly persistPath?: string
  readonly sync?: boolean
}

export interface AuthBridge<User = unknown> {
  readonly sessionManager: {
    login(credentials: { username: string; password: string }): Promise<unknown>
    logout(): Promise<void>
    restore(): Promise<unknown>
    current(): unknown
    subscribe(listener: (session: unknown) => void): () => void
  }
  readonly tokens?: { ensureValid(): Promise<unknown> } | undefined
}

export type DesktopObservabilityOptions = Omit<ObservabilityOptions, 'appVersion' | 'platform' | 'arch'>

export interface DesktopAutoLaunchOptions extends AutoLaunchOptions {
  readonly enabled: boolean
}

export interface DesktopMainOptions {
  config: DesktopConfig
  window: DesktopWindowOptions
  windows?: readonly DesktopWindowOptions[]
  childWindows?: Readonly<Record<string, DesktopWindowOptions>>
  menuTemplate?: readonly MenuItemTemplate[]
  tray?: TrayOptions
  shortcuts?: Readonly<Record<string, ShortcutAction>>
  state?: StateOptions
  recentFiles?: { readonly limit?: number }
  auth?: AuthBridge
  updater?: UpdateService
  updaterAdapter?: UpdateAdapter
  releaseChannel?: ReleaseChannel
  onRollback?: (version: string) => void
  deps?: DesktopMainDeps
  environment?: EnvironmentSource
  proxy?: ProxyConfigInput
  observability?: DesktopObservabilityOptions
  autoLaunch?: DesktopAutoLaunchOptions
  onShutdown?: () => void | Promise<void>
  onError?: (error: Error, scope: ErrorScope) => void
}

const APP_ORIGIN = 'file:'
const MAIN_WINDOW_ID = 'main'

export { type WindowState }

function registerPermissionPolicy(target: Session): void {
  target.setPermissionRequestHandler((_webContents, permission, callback) => callback(isPermissionAllowed(permission)))
  target.setPermissionCheckHandler((_webContents, permission) => isPermissionAllowed(permission))
}

function focusMainWindow(): void {
  const target = BrowserWindow.getAllWindows()[0]
  if (target?.isMinimized()) target.restore()
  target?.show()
  target?.focus()
}

export function acquireSingleInstance(onSecondInstance: (commandLine: readonly string[]) => void): boolean {
  return createSingleInstance({
    app: app as unknown as SingleInstanceApp,
    onSecondInstance,
    focus: focusMainWindow
  })
}

function resolveStatePath(options: DesktopWindowOptions): string {
  return options.statePath ?? join(app.getPath('userData'), 'window-state.json')
}

function definedNumber(value: number | undefined): number | undefined {
  return value
}

function resolveWorkAreas(): DisplayWorkArea[] {
  try {
    return screen.getAllDisplays().map((display) => display.workArea)
  } catch {
    return []
  }
}

function compact<T extends object>(value: T): { [K in keyof T]?: NonNullable<T[K]> } {
  const result: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) result[key] = item
  }
  return result as { [K in keyof T]?: NonNullable<T[K]> }
}

function persistWindowState(window: BrowserWindow, statePath: string): void {
  const [width = 0, height = 0] = window.getSize()
  const [x, y] = window.getPosition()
  const next: WindowState = {
    width,
    height,
    ...(x === undefined ? {} : { x }),
    ...(y === undefined ? {} : { y }),
    isMaximized: window.isMaximized(),
    isFullScreen: window.isFullScreen()
  }
  void saveWindowState(statePath, next)
}

function buildDesktopWindow(options: DesktopWindowOptions, state: WindowState): BrowserWindow {
  const intended: WindowBounds = {
    width: options.width ?? state.width,
    height: options.height ?? state.height,
    ...(state.x === undefined ? {} : { x: state.x }),
    ...(state.y === undefined ? {} : { y: state.y })
  }
  const bounds = ensureVisibleOnDisplays(intended, resolveWorkAreas())
  const windowOptions: BrowserWindowConstructorOptions = {
    width: bounds.width,
    height: bounds.height,
    ...compact<WindowChromeOptions>(options.chrome ?? {}),
    ...(definedNumber(bounds.x) === undefined ? {} : { x: bounds.x as number }),
    ...(definedNumber(bounds.y) === undefined ? {} : { y: bounds.y as number }),
    ...(options.parent === undefined ? {} : { parent: options.parent }),
    ...(options.modal === undefined ? {} : { modal: options.modal })
  }
  windowOptions.webPreferences = {
    preload: options.preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  }
  const window = new BrowserWindow(windowOptions)
  const statePath = resolveStatePath(options)
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) event.preventDefault()
  })
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })
  if (state.isMaximized && options.width === undefined) window.maximize()
  if (state.isFullScreen && options.chrome?.fullscreen === undefined) window.setFullScreen(true)
  window.on('resize', () => persistWindowState(window, statePath))
  window.on('move', () => persistWindowState(window, statePath))
  const page = options.devServerUrl ? window.loadURL(options.devServerUrl) : window.loadFile(options.rendererFile)
  void page
  return window
}

export async function createDesktopWindow(options: DesktopWindowOptions): Promise<BrowserWindow> {
  const state = options.statePath ? await loadWindowState(options.statePath) : DEFAULT_WINDOW_STATE
  return buildDesktopWindow(options, state)
}

export function createChildWindow(parent: BrowserWindow, options: DesktopWindowOptions): BrowserWindow {
  return buildDesktopWindow({ ...options, parent, modal: options.modal ?? false }, DEFAULT_WINDOW_STATE)
}

function resolveMenuPort(deps: DesktopMainDeps): MenuPort {
  return deps.menu ?? {
    buildFromTemplate: (template) => Menu.buildFromTemplate(template as Parameters<typeof Menu.buildFromTemplate>[0]),
    setApplicationMenu: (menu) => Menu.setApplicationMenu(menu as Parameters<typeof Menu.setApplicationMenu>[0])
  }
}

function createElectronDialogPort(): DialogPort {
  return {
    showOpenDialog: (target, options) =>
      target
        ? dialog.showOpenDialog(target as BrowserWindow, options as OpenDialogOptions)
        : dialog.showOpenDialog(options as OpenDialogOptions),
    showSaveDialog: (target, options) =>
      target
        ? dialog.showSaveDialog(target as BrowserWindow, options as SaveDialogOptions)
        : dialog.showSaveDialog(options as SaveDialogOptions),
    showMessageBox: (target, options) =>
      target
        ? dialog.showMessageBox(target as BrowserWindow, options as MessageBoxOptions)
        : dialog.showMessageBox(options as MessageBoxOptions)
  }
}

interface DesktopServices {
  readonly dialogs: DialogService
  readonly contextMenu: ContextMenuHandler
  readonly integration: PlatformIntegration
  readonly openChildWindow: (id: string) => boolean
  readonly recent: RecentItems
  readonly store: Store<unknown>
  readonly watchers: Map<string, Watcher>
  readonly notifyWatchers: (id: string, payload: unknown) => void
  readonly clipboard: ClipboardService
  readonly notifications: NotificationService
  readonly shell: ReturnType<typeof createShellService>
  readonly system: () => SystemInfo
  readonly power: () => Promise<BatteryStatus>
  readonly network: () => Promise<NetworkStatus>
  readonly secrets: SecretStore
  readonly transfers: TransferManager
  readonly auth?: AuthBridge | undefined
  readonly updates?: UpdateService | undefined
}

function registerFileIpc(registry: ReturnType<typeof createIpcRegistry>, services: DesktopServices): void {
  registry.register({ channel: DESKTOP_CHANNELS.pickFile, handle: () => services.dialogs.openFile() })
  registry.register({ channel: DESKTOP_CHANNELS.pickDirectory, handle: () => services.dialogs.openDirectory() })
  registry.register({ channel: DESKTOP_CHANNELS.fsReadText, handle: ({ request }) => readText(request.path) })
  registry.register({ channel: DESKTOP_CHANNELS.fsWriteText, handle: ({ request }) => writeText(request.path, request.content) })
  registry.register({ channel: DESKTOP_CHANNELS.fsReadJson, handle: ({ request }) => readJson(request.path) })
  registry.register({ channel: DESKTOP_CHANNELS.fsWriteJson, handle: ({ request }) => writeJson(request.path, request.value) })
  registry.register({ channel: DESKTOP_CHANNELS.fsList, handle: ({ request }) => listDirectory(request.path) })
  registry.register({ channel: DESKTOP_CHANNELS.fsExists, handle: ({ request }) => fileExists(request.path) })
  registry.register({ channel: DESKTOP_CHANNELS.fsCopy, handle: ({ request }) => copyPath(request.source, request.destination) })
  registry.register({ channel: DESKTOP_CHANNELS.fsMove, handle: ({ request }) => movePath(request.source, request.destination) })
  registry.register({ channel: DESKTOP_CHANNELS.fsRemove, handle: ({ request }) => removePath(request.path) })
  registry.register({ channel: DESKTOP_CHANNELS.fsMime, handle: ({ request }) => detectMimeType(request.path) })
  registry.register({
    channel: DESKTOP_CHANNELS.fsRecentAdd,
    handle: ({ request }) => {
      services.recent.add(request.path)
    }
  })
  registry.register({ channel: DESKTOP_CHANNELS.fsRecentList, handle: () => services.recent.list() })
  registry.register({
    channel: DESKTOP_CHANNELS.fsRecentRemove,
    handle: ({ request }) => {
      services.recent.remove(request.path)
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.fsRecentClear,
    handle: () => {
      services.recent.clear()
    }
  })
  registry.register({ channel: DESKTOP_CHANNELS.fsWatchStart, handle: ({ request }) => startWatch(services, request.path) })
  registry.register({
    channel: DESKTOP_CHANNELS.fsWatchStop,
    handle: ({ request }) => {
      const watcher = services.watchers.get(request.id)
      if (watcher) {
        services.watchers.delete(request.id)
        void watcher.close()
      }
    }
  })
}

function startWatch(services: DesktopServices, target: string): string {
  const id = `watch-${services.watchers.size + 1}-${Date.now()}`
  const watcher = watchPath(target, (event) => services.notifyWatchers(id, event))
  services.watchers.set(id, watcher)
  return id
}

function registerStateIpc(registry: ReturnType<typeof createIpcRegistry>, services: DesktopServices): void {
  registry.register({ channel: DESKTOP_CHANNELS.storeGet, handle: () => services.store.get() })
  registry.register({
    channel: DESKTOP_CHANNELS.storeSet,
    handle: ({ request }) => {
      services.store.set(request)
    }
  })
}

function registerSystemIpc(registry: ReturnType<typeof createIpcRegistry>, services: DesktopServices): void {
  registry.register({ channel: DESKTOP_CHANNELS.shellOpenPath, handle: ({ request }) => services.shell.openPath(request.path) })
  registry.register({
    channel: DESKTOP_CHANNELS.shellShowItemInFolder,
    handle: ({ request }) => {
      services.shell.showItemInFolder(request.path)
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.shellTrashItem,
    handle: ({ request }) => services.shell.trashItem(request.path)
  })
  registry.register({
    channel: DESKTOP_CHANNELS.notify,
    handle: ({ request }) => services.notifications.show(request)
  })
  registry.register({ channel: DESKTOP_CHANNELS.clipboardClear, handle: () => services.clipboard.clear() })
  registry.register({ channel: DESKTOP_CHANNELS.clipboardHasImage, handle: () => services.clipboard.hasImage() })
  registry.register({ channel: DESKTOP_CHANNELS.clipboardHasHtml, handle: () => services.clipboard.hasHtml() })
  registry.register({ channel: DESKTOP_CHANNELS.clipboardReadImage, handle: () => services.clipboard.readImage() })
  registry.register({
    channel: DESKTOP_CHANNELS.clipboardWriteImage,
    handle: ({ request }) => services.clipboard.writeImage(request)
  })
  registry.register({ channel: DESKTOP_CHANNELS.systemInfo, handle: () => services.system() })
  registry.register({ channel: DESKTOP_CHANNELS.powerStatus, handle: () => services.power() })
  registry.register({ channel: DESKTOP_CHANNELS.networkStatus, handle: () => services.network() })
  registry.register({ channel: DESKTOP_CHANNELS.secretsGet, handle: ({ request }) => services.secrets.get(request.key) })
  registry.register({
    channel: DESKTOP_CHANNELS.secretsSet,
    handle: ({ request }) => services.secrets.set(request.key, request.value)
  })
  registry.register({ channel: DESKTOP_CHANNELS.secretsHas, handle: ({ request }) => services.secrets.has(request.key) })
  registry.register({
    channel: DESKTOP_CHANNELS.secretsRemove,
    handle: ({ request }) => services.secrets.remove(request.key)
  })
  registry.register({
    channel: DESKTOP_CHANNELS.downloadStart,
    handle: ({ request }) => services.transfers.download(request.url, request.savePath === undefined ? {} : { savePath: request.savePath })
  })
  registry.register({
    channel: DESKTOP_CHANNELS.downloadCancelAll,
    handle: () => services.transfers.cancelAll()
  })
}

function registerAuthIpc(registry: ReturnType<typeof createIpcRegistry>, auth: AuthBridge): void {
  const { sessionManager, tokens } = auth
  registry.register({ channel: DESKTOP_CHANNELS.authLogin, handle: ({ request }) => sessionManager.login(request) })
  registry.register({
    channel: DESKTOP_CHANNELS.authLogout,
    handle: () => sessionManager.logout()
  })
  registry.register({ channel: DESKTOP_CHANNELS.authSession, handle: () => sessionManager.current() })
  registry.register({
    channel: DESKTOP_CHANNELS.authTokens,
    handle: async () => (tokens ? tokens.ensureValid() : null)
  })
}

function registerUpdateIpc(registry: ReturnType<typeof createIpcRegistry>, updates: UpdateService): void {
  registry.register({ channel: DESKTOP_CHANNELS.updateCheck, handle: () => updates.check() })
  registry.register({ channel: DESKTOP_CHANNELS.updateDownload, handle: () => updates.download() })
  registry.register({
    channel: DESKTOP_CHANNELS.updateInstall,
    handle: () => {
      updates.install('')
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.updateRollback,
    handle: () => {
      updates.rollback()
    }
  })
}

function registerDesktopIpc(
  deps: DesktopMainDeps,
  logger: Logger,
  services: DesktopServices,
  observability: Observability
): () => void {
  const shellApi = deps.shell ?? shell
  const registry = createIpcRegistry(ipcMain, {
    origin: APP_ORIGIN,
    logger,
    tracer: observability.tracer,
    metrics: observability.metrics
  })

  registry.register({ channel: DESKTOP_CHANNELS.getVersion, handle: () => app.getVersion() })
  registry.register({ channel: DESKTOP_CHANNELS.getLocale, handle: () => app.getLocale() })
  registry.register({
    channel: DESKTOP_CHANNELS.submitFeedback,
    handle: async ({ request }) => {
      await observability.submitFeedback(request)
      return true
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.crashReport,
    handle: async ({ request }) => {
      const error = new Error(request.message)
      if (request.stack !== undefined) error.stack = request.stack
      await observability.reportCrash(error, request.context)
      return true
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.openExternal,
    handle: async ({ request }) => {
      if (!isAllowedExternalUrl(request)) return false
      await shellApi.openExternal(request)
      return true
    }
  })
  registry.register({ channel: DESKTOP_CHANNELS.openFile, handle: () => services.dialogs.openFile() })
  registry.register({ channel: DESKTOP_CHANNELS.openFiles, handle: () => services.dialogs.openFiles() })
  registry.register({ channel: DESKTOP_CHANNELS.openDirectory, handle: () => services.dialogs.openDirectory() })
  registry.register({ channel: DESKTOP_CHANNELS.saveFile, handle: ({ request }) => services.dialogs.saveFile(request) })
  registry.register({ channel: DESKTOP_CHANNELS.confirm, handle: ({ request }) => services.dialogs.confirm(request) })
  registry.register({ channel: DESKTOP_CHANNELS.readClipboard, handle: () => services.clipboard.readText() })
  registry.register({
    channel: DESKTOP_CHANNELS.writeClipboard,
    handle: ({ request }) => services.clipboard.writeText(request)
  })
  registry.register({ channel: DESKTOP_CHANNELS.openWindow, handle: ({ request }) => services.openChildWindow(request) })
  registry.register({ channel: DESKTOP_CHANNELS.contextMenuShow, handle: ({ request }) => services.contextMenu(request) })
  registry.register({
    channel: DESKTOP_CHANNELS.setBadge,
    handle: ({ request }) => {
      services.integration.setBadge(request)
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.requestAttention,
    handle: ({ request }) => {
      services.integration.requestAttention(request)
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.setProgress,
    handle: ({ request }) => {
      services.integration.setProgress(request)
    }
  })
  registry.register({
    channel: DESKTOP_CHANNELS.flashFrame,
    handle: ({ request }) => {
      services.integration.flash(request)
    }
  })
  registerFileIpc(registry, services)
  registerStateIpc(registry, services)
  registerSystemIpc(registry, services)
  if (services.auth) registerAuthIpc(registry, services.auth)
  if (services.updates) registerUpdateIpc(registry, services.updates)

  return () => registry.dispose()
}

function registerWindowControls(): () => void {
  const isTrusted = (event: { sender: WebContents }): boolean => isTrustedSender({ url: event.sender.getURL() }, APP_ORIGIN)
  const onMinimize = (event: { sender: WebContents }): void => {
    if (isTrusted(event)) BrowserWindow.fromWebContents(event.sender)?.minimize()
  }
  const onMaximize = (event: { sender: WebContents }): void => {
    if (!isTrusted(event)) return
    const target = BrowserWindow.fromWebContents(event.sender)
    if (target) (target.isMaximized() ? target.unmaximize() : target.maximize())
  }
  const onClose = (event: { sender: WebContents }): void => {
    if (isTrusted(event)) BrowserWindow.fromWebContents(event.sender)?.close()
  }
  const onToggleFullScreen = (event: { sender: WebContents }): void => {
    if (!isTrusted(event)) return
    const target = BrowserWindow.fromWebContents(event.sender)
    if (target) target.setFullScreen(!target.isFullScreen())
  }
  const onSetAlwaysOnTop = (event: { sender: WebContents }, flag: unknown): void => {
    if (!isTrusted(event) || typeof flag !== 'boolean') return
    BrowserWindow.fromWebContents(event.sender)?.setAlwaysOnTop(flag)
  }

  ipcMain.on(DESKTOP_CHANNELS.minimize.name, onMinimize)
  ipcMain.on(DESKTOP_CHANNELS.maximize.name, onMaximize)
  ipcMain.on(DESKTOP_CHANNELS.close.name, onClose)
  ipcMain.on(DESKTOP_CHANNELS.toggleFullScreen.name, onToggleFullScreen)
  ipcMain.on(DESKTOP_CHANNELS.setAlwaysOnTop.name, onSetAlwaysOnTop)

  return () => {
    ipcMain.removeListener(DESKTOP_CHANNELS.minimize.name, onMinimize)
    ipcMain.removeListener(DESKTOP_CHANNELS.maximize.name, onMaximize)
    ipcMain.removeListener(DESKTOP_CHANNELS.close.name, onClose)
    ipcMain.removeListener(DESKTOP_CHANNELS.toggleFullScreen.name, onToggleFullScreen)
    ipcMain.removeListener(DESKTOP_CHANNELS.setAlwaysOnTop.name, onSetAlwaysOnTop)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

async function readClipboardImage(): Promise<Uint8Array> {
  const items = await clipboard.read()
  for (const item of items) {
    if (!item.types.includes(IMAGE_MIME_TYPE)) continue
    const blob = (await item.getType(IMAGE_MIME_TYPE)) as Blob
    return new Uint8Array(await blob.arrayBuffer())
  }
  return new Uint8Array()
}

async function writeClipboardImage(png: Uint8Array): Promise<void> {
  const blob = new Blob([png as unknown as BlobPart], { type: IMAGE_MIME_TYPE })
  await clipboard.write([new ClipboardItem({ [IMAGE_MIME_TYPE]: blob })])
}

export function createMainProcess(options: DesktopMainOptions): void {
  const config = options.config
  const environment = resolveEnvironment({
    nodeEnv: options.environment?.nodeEnv ?? process.env.NODE_ENV,
    isPackaged: options.environment?.isPackaged ?? app.isPackaged
  })
  const isMacOS = process.platform === 'darwin'
  const observability = createObservability({
    appVersion: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    level: levelFromEnvironment(environment.name),
    ...(options.deps?.logger === undefined ? {} : { logger: options.deps.logger }),
    ...(options.observability ?? {})
  })
  const logger = observability.logger
  const deps: DesktopMainDeps = { ...(options.deps ?? {}), logger }
  observability.metrics.increment('app.starts')

  const windows = createWindowRegistry<BrowserWindow>()
  const shutdown = createShutdownManager({ logger })
  const definitions: readonly DesktopWindowOptions[] = [options.window, ...(options.windows ?? [])]
  const childWindows = new Map(Object.entries(options.childWindows ?? {}))

  const forwardDeepLink = (url: string | undefined): void => {
    if (!url) return
    logger.info('Deep link received', { url })
    windows.get(MAIN_WINDOW_ID)?.webContents.send(DESKTOP_CHANNELS.deepLink.name, url)
  }

  if (!acquireSingleInstance((commandLine) => forwardDeepLink(findDeepLinkArgument(commandLine, config.protocol)))) {
    return
  }

  const openWindow = async (id: string, definition: DesktopWindowOptions): Promise<void> => {
    const state = definition.statePath ? await loadWindowState(definition.statePath) : DEFAULT_WINDOW_STATE
    windows.open(id, () => buildDesktopWindow(definition, state))
  }

  const openWindows = async (): Promise<void> => {
    await Promise.all(definitions.map((definition, index) => openWindow(index === 0 ? MAIN_WINDOW_ID : `window-${index}`, definition)))
  }

  const focusedWindow = (): BrowserWindow | undefined => BrowserWindow.getFocusedWindow() ?? windows.get(MAIN_WINDOW_ID)

  const openChildWindow = (id: string): boolean => {
    const definition = childWindows.get(id)
    if (!definition) return false
    const parent = definition.parent ?? focusedWindow()
    windows.open(id, () =>
      buildDesktopWindow({ ...definition, ...(parent === undefined ? {} : { parent }) }, DEFAULT_WINDOW_STATE)
    )
    return true
  }

  const integration = createPlatformIntegration({
    app: {
      setBadgeCount: (count) => app.setBadgeCount(count),
      ...(deps.dock ?? (app.dock as DockPort | undefined) ? { dock: deps.dock ?? (app.dock as DockPort | undefined) } : {})
    },
    taskbar: deps.taskbar ?? {
      setProgressBar: (progress, progressOptions) => {
        windows.get(MAIN_WINDOW_ID)?.setProgressBar(progress, progressOptions)
      },
      flashFrame: (flag) => {
        windows.get(MAIN_WINDOW_ID)?.flashFrame(flag)
      }
    },
    isMacOS
  })

  const recent = createRecentItems(options.recentFiles ?? {})
  const store = createStore<unknown>(options.state?.initial ?? null)
  const watchers = new Map<string, Watcher>()
  const syncs: StateSync<unknown, BrowserWindow>[] = []

  const notifyWatchers = (id: string, payload: unknown): void => {
    windows.broadcast(DESKTOP_CHANNELS.fsWatchEvent.name, { ...(payload as object), id })
  }

  shutdown.register({ name: 'windows', run: () => windows.closeAll() })
  if (options.onShutdown) shutdown.register({ name: 'consumer', run: options.onShutdown })
  shutdown.register({
    name: 'global-errors',
    run: installGlobalErrorHandlers({
      source: process as unknown as ErrorEventSource,
      logger,
      onError: (error, scope) => {
        void observability.reportCrash(error, { scope })
        options.onError?.(error, scope)
      }
    })
  })
  shutdown.register({ name: 'logger', run: () => logger.flush() })

  const lifecycle = createAppLifecycle({
    app: app as unknown as AppEventTarget,
    logger,
    shutdown,
    isMacOS,
    onReady: async () => {
      registerPermissionPolicy(session.defaultSession)
      await openWindows()

      const menu = resolveMenuPort(deps)
      createMenuService(menu).setApplicationMenu([...(options.menuTemplate ?? defaultApplicationMenuTemplate(isMacOS))])

      const dialogs = createDialogService({ dialog: deps.dialog ?? createElectronDialogPort(), resolveWindow: focusedWindow })
      const contextMenu = createContextMenuHandler({ menu, resolveWindow: focusedWindow })

      if (options.state && options.state.sync !== false) {
        const sync = createStateSync({ store, registry: windows, channel: DESKTOP_CHANNELS.storeChanged.name })
        syncs.push(sync)
      }

      const secrets = createSecretStore({
        storage: createFileStorage<string>(join(app.getPath('userData'), 'secrets.json')),
        isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
        encryptString: (value) => safeStorage.encryptString(value),
        decryptString: (value) => safeStorage.decryptString(value)
      })
      const systemServices: Pick<
        DesktopServices,
        'clipboard' | 'notifications' | 'shell' | 'system' | 'power' | 'network' | 'secrets' | 'transfers'
      > = {
        clipboard: createClipboardService({
          readText: () => clipboard.readText(),
          writeText: (value) => clipboard.writeText(value),
          readImage: () => readClipboardImage(),
          writeImage: (png) => writeClipboardImage(png),
          has: (mimeType) => clipboard.has(mimeType),
          clear: () => clipboard.clear()
        }),
        notifications: createNotificationService({ Notification, isSupported: () => Notification.isSupported() }),
        shell: createShellService(shell),
        system: () =>
          collectSystemInfo({
            platform: () => process.platform,
            arch: () => process.arch,
            release: () => release(),
            hostname: () => hostname(),
            cpus: () => cpus(),
            totalMemory: () => totalMemory(),
            freeMemory: () => freeMemory(),
            uptime: () => uptime(),
            appVersion: () => app.getVersion(),
            executableName: () => app.getName(),
            locale: () => app.getLocale(),
            isPackaged: () => app.isPackaged
          }),
        power: () =>
          readBatteryStatus({
            getPowerSaveBlockerState: async () => (powerMonitor.isOnBatteryPower() ? 'discharging' : 'charging'),
            getBatteryLevel: async () => 0
          }),
        network: () => readNetworkStatus({ isOnline: () => true }),
        secrets,
        transfers: createTransferManager({
          session: session.defaultSession,
          onProgress: (progress: TransferProgress) => windows.broadcast(DESKTOP_CHANNELS.transferProgress.name, progress),
          onError: (error) => logger.warn('Transfer error', { message: errorMessage(error) })
        })
      }

      if (options.auth) {
        const unsubscribe = options.auth.sessionManager.subscribe((session) =>
          windows.broadcast(DESKTOP_CHANNELS.authChanged.name, session)
        )
        shutdown.register({ name: 'auth', run: () => unsubscribe() })
        void options.auth.sessionManager.restore().catch((error: unknown) =>
          logger.warn('Failed to restore session', { message: errorMessage(error) })
        )
      }

      const updates = options.updaterAdapter
        ? createUpdateService({
            adapter: {
              ...options.updaterAdapter,
              subscribeProgress: (listener) => windows.broadcast(DESKTOP_CHANNELS.updateProgress.name, listener)
            },
            currentVersion: app.getVersion(),
            channel: options.releaseChannel ?? resolveChannel('stable'),
            ...(options.onRollback ? { onRollback: options.onRollback } : {})
          })
        : undefined

      installContentSecurityPolicy(session.defaultSession, {
        apiOrigins: config.apiBaseUrl ? [new URL(config.apiBaseUrl).origin] : [],
        ...(options.window.devServerUrl ? { devServerUrl: options.window.devServerUrl } : {})
      })

      if (options.proxy) {
        void applyProxy(session.defaultSession, options.proxy).catch((error: unknown) =>
          logger.warn('Failed to apply proxy', { message: errorMessage(error) })
        )
      }

      const powerMonitorHandle = createPowerMonitor(powerMonitor, {
        onSuspend: () => windows.broadcast(DESKTOP_CHANNELS.powerSuspend.name),
        onResume: () => windows.broadcast(DESKTOP_CHANNELS.powerResume.name),
        onLock: () => windows.broadcast(DESKTOP_CHANNELS.powerLock.name),
        onUnlock: () => windows.broadcast(DESKTOP_CHANNELS.powerUnlock.name)
      })
      shutdown.register({ name: 'power-monitor', run: () => powerMonitorHandle.dispose() })

      shutdown.register({
        name: 'ipc',
        run: registerDesktopIpc(
          deps,
          logger,
          {
            dialogs,
            contextMenu,
            integration,
            openChildWindow,
            recent,
            store,
            watchers,
            notifyWatchers,
            ...(options.auth ? { auth: options.auth } : {}),
            ...(updates ? { updates } : {}),
            ...systemServices
          },
          observability
        )
      })
      shutdown.register({ name: 'window-controls', run: registerWindowControls() })
      shutdown.register({
        name: 'watchers',
        run: async () => {
          await Promise.all([...watchers.values()].map((watcher) => watcher.close()))
          watchers.clear()
          for (const sync of syncs) sync.dispose()
        }
      })

      if (options.shortcuts) {
        const shortcuts = createShortcutManager(deps.shortcuts ?? globalShortcut)
        shortcuts.registerAll(options.shortcuts)
        shutdown.register({ name: 'shortcuts', run: () => shortcuts.dispose() })
      }

      const mainWindow = windows.get(MAIN_WINDOW_ID)
      if (options.tray && mainWindow) {
        const tray = createTrayController({
          tray: deps.tray ?? new Tray(options.tray.iconPath),
          window: mainWindow as unknown as TrayWindow,
          menu,
          labels: options.tray.labels,
          tooltip: options.tray.tooltip,
          onQuit: () => app.quit(),
          ...(options.tray.minimizeToTray === undefined ? {} : { minimizeToTray: options.tray.minimizeToTray }),
          ...(options.tray.closeToTray === undefined ? {} : { closeToTray: options.tray.closeToTray }),
          shouldQuit: () => shutdown.isShuttingDown
        })
        shutdown.register({ name: 'tray', run: () => tray.dispose() })
      }

      if (options.autoLaunch) {
        createAutoLaunch(
          {
            getLoginItemSettings: () => app.getLoginItemSettings(),
            setLoginItemSettings: (settings) => app.setLoginItemSettings(settings)
          },
          {
            ...(options.autoLaunch.openAsHidden === undefined ? {} : { openAsHidden: options.autoLaunch.openAsHidden }),
            ...(options.autoLaunch.args === undefined ? {} : { args: options.autoLaunch.args })
          }
        ).setEnabled(options.autoLaunch.enabled)
      }
      if (config.features.deepLink) app.setAsDefaultProtocolClient(config.protocol)
      if (config.features.autoUpdate) {
        const service = options.updater ?? updates
        void service?.check().catch((error: unknown) => logger.warn('Update check failed', { message: errorMessage(error) }))
      }
      app.on('open-url', (event, url) => {
        event.preventDefault()
        forwardDeepLink(url)
      })
      app.on('render-process-gone', (_event, _contents, details) => {
        logger.error('Renderer process gone', { reason: details.reason })
        void observability.reportCrash(new Error(`Renderer process gone: ${details.reason}`), {
          reason: details.reason,
          exitCode: details.exitCode
        })
      })
      app.on('child-process-gone', (_event, details) => {
        logger.error('Child process gone', { reason: details.reason, type: details.type })
        void observability.reportCrash(new Error(`Child process gone: ${details.reason}`), {
          reason: details.reason,
          type: details.type
        })
      })
      logger.info('Application ready', { environment: environment.name })
    },
    onActivate: async () => {
      if (windows.size() === 0) await openWindows()
    }
  })

  shutdown.register({ name: 'lifecycle', run: () => lifecycle.dispose() })
}
