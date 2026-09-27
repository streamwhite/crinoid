import { isTrustedSender } from './security.js'
import type { Logger } from './logging.js'
import type { Tracer } from './trace.js'
import type { Metrics } from './metrics.js'
import { isConfirmDialogOptions, isSaveDialogRequest, type ConfirmDialogOptions, type SaveDialogRequest } from './dialogs.js'
import { isContextMenuRequest, type ContextMenuRequest } from './context-menu.js'
import type { SystemInfo } from './system.js'
import type { BatteryStatus } from './power.js'
import type { NetworkStatus } from './network.js'
import type { UpdateCheckResult } from './tasks.js'
import type { FeedbackCategory } from './feedback.js'

export const IPC_CHANNELS = {
  getVersion: 'app.get-version',
  getLocale: 'app.get-locale',
  submitFeedback: 'feedback.submit',
  crashReport: 'crash.report',
  minimize: 'window.minimize',
  maximize: 'window.maximize',
  close: 'window.close',
  toggleFullScreen: 'window.toggle-full-screen',
  setAlwaysOnTop: 'window.set-always-on-top',
  openWindow: 'window.open',
  openExternal: 'shell.open-external',
  openFile: 'dialog.open-file',
  openFiles: 'dialog.open-files',
  openDirectory: 'dialog.open-directory',
  saveFile: 'dialog.save-file',
  confirm: 'dialog.confirm',
  pickFile: 'fs.pick-file',
  pickDirectory: 'fs.pick-directory',
  fsReadText: 'fs.read-text',
  fsWriteText: 'fs.write-text',
  fsReadJson: 'fs.read-json',
  fsWriteJson: 'fs.write-json',
  fsList: 'fs.list',
  fsExists: 'fs.exists',
  fsCopy: 'fs.copy',
  fsMove: 'fs.move',
  fsRemove: 'fs.remove',
  fsMime: 'fs.mime',
  fsRecentAdd: 'fs.recent-add',
  fsRecentList: 'fs.recent-list',
  fsRecentRemove: 'fs.recent-remove',
  fsRecentClear: 'fs.recent-clear',
  fsWatchStart: 'fs.watch-start',
  fsWatchStop: 'fs.watch-stop',
  fsWatchEvent: 'fs.watch-event',
  storeGet: 'store.get',
  storeSet: 'store.set',
  storeChanged: 'store.changed',
  preferencesGet: 'preferences.get',
  preferencesSet: 'preferences.set',
  preferencesAll: 'preferences.all',
  shellOpenPath: 'shell.open-path',
  shellShowItemInFolder: 'shell.show-item',
  shellTrashItem: 'shell.trash-item',
  notify: 'notification.show',
  clipboardClear: 'clipboard.clear',
  clipboardHasImage: 'clipboard.has-image',
  clipboardHasHtml: 'clipboard.has-html',
  clipboardReadImage: 'clipboard.read-image',
  clipboardWriteImage: 'clipboard.write-image',
  systemInfo: 'system.info',
  powerStatus: 'power.status',
  networkStatus: 'network.status',
  downloadStart: 'transfer.download',
  downloadCancelAll: 'transfer.cancel-all',
  transferProgress: 'transfer.progress',
  powerSuspend: 'power.suspend',
  powerResume: 'power.resume',
  powerLock: 'power.lock',
  powerUnlock: 'power.unlock',
  secretsGet: 'secrets.get',
  secretsSet: 'secrets.set',
  secretsHas: 'secrets.has',
  secretsRemove: 'secrets.remove',
  authLogin: 'auth.login',
  authLogout: 'auth.logout',
  authSession: 'auth.session',
  authChanged: 'auth.changed',
  authTokens: 'auth.tokens',
  updateCheck: 'update.check',
  updateDownload: 'update.download',
  updateInstall: 'update.install',
  updateRollback: 'update.rollback',
  updateChannel: 'update.channel',
  updateProgress: 'update.progress',
  readClipboard: 'clipboard.read-text',
  writeClipboard: 'clipboard.write-text',
  contextMenuShow: 'context-menu.show',
  setBadge: 'app.set-badge',
  requestAttention: 'app.request-attention',
  setProgress: 'app.set-progress',
  flashFrame: 'app.flash-frame',
  deepLink: 'app.deep-link'
} as const

export type IpcChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface IpcChannel<Request, Response> {
  readonly name: string
  validate(value: unknown): value is Request
  respond(value: Response): Response
}

export function createChannel<Request, Response>(
  name: string,
  validate: (value: unknown) => value is Request
): IpcChannel<Request, Response> {
  return { name, validate, respond: (value) => value }
}

const isUndefined = (value: unknown): value is undefined => value === undefined
const isString = (value: unknown): value is string => typeof value === 'string'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isNumber = (value: unknown): value is number => typeof value === 'number'
const isBytes = (value: unknown): value is Uint8Array => value instanceof Uint8Array

const isWriteRequest = (value: unknown): value is { path: string; content: string } =>
  isRecord(value) && typeof value.path === 'string' && typeof value.content === 'string'

const isJsonWriteRequest = (value: unknown): value is { path: string; value: unknown } =>
  isRecord(value) && typeof value.path === 'string'

const isPathRequest = (value: unknown): value is { path: string } => isRecord(value) && typeof value.path === 'string'

const isPathPairRequest = (value: unknown): value is { source: string; destination: string } =>
  isRecord(value) && typeof value.source === 'string' && typeof value.destination === 'string'

const isWatchEvent = (value: unknown): value is { type: string; fileName: string | null } =>
  isRecord(value) && typeof value.type === 'string' && (value.fileName === null || typeof value.fileName === 'string')

const isKeyRequest = (value: unknown): value is { key: string } => isRecord(value) && typeof value.key === 'string'

const isSecretWriteRequest = (value: unknown): value is { key: string; value: string } =>
  isRecord(value) && typeof value.key === 'string' && typeof value.value === 'string'

const isNotificationRequest = (value: unknown): value is { title: string; body: string; silent?: boolean } =>
  isRecord(value) &&
  typeof value.title === 'string' &&
  typeof value.body === 'string' &&
  (value.silent === undefined || typeof value.silent === 'boolean')

const isDownloadRequest = (value: unknown): value is { url: string; savePath?: string } =>
  isRecord(value) && typeof value.url === 'string' && (value.savePath === undefined || typeof value.savePath === 'string')

const isCredentials = (value: unknown): value is { username: string; password: string } =>
  isRecord(value) && typeof value.username === 'string' && typeof value.password === 'string'

const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = ['bug', 'feature', 'question', 'other']

export interface FeedbackRequest {
  readonly message: string
  readonly category?: FeedbackCategory | undefined
  readonly email?: string | undefined
}

const isFeedbackRequest = (value: unknown): value is FeedbackRequest =>
  isRecord(value) &&
  typeof value.message === 'string' &&
  value.message.trim().length > 0 &&
  (value.category === undefined || (FEEDBACK_CATEGORIES as readonly unknown[]).includes(value.category)) &&
  (value.email === undefined || typeof value.email === 'string')

export interface CrashReportRequest {
  readonly message: string
  readonly stack?: string | undefined
  readonly context?: Record<string, unknown> | undefined
}

const isCrashReportRequest = (value: unknown): value is CrashReportRequest =>
  isRecord(value) &&
  typeof value.message === 'string' &&
  value.message.trim().length > 0 &&
  (value.stack === undefined || typeof value.stack === 'string') &&
  (value.context === undefined || isRecord(value.context))

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export const DESKTOP_CHANNELS = {
  getVersion: createChannel<void, string>(IPC_CHANNELS.getVersion, isUndefined),
  getLocale: createChannel<void, string>(IPC_CHANNELS.getLocale, isUndefined),
  submitFeedback: createChannel<FeedbackRequest, boolean>(IPC_CHANNELS.submitFeedback, isFeedbackRequest),
  crashReport: createChannel<CrashReportRequest, boolean>(IPC_CHANNELS.crashReport, isCrashReportRequest),
  minimize: createChannel<void, void>(IPC_CHANNELS.minimize, isUndefined),
  maximize: createChannel<void, void>(IPC_CHANNELS.maximize, isUndefined),
  close: createChannel<void, void>(IPC_CHANNELS.close, isUndefined),
  toggleFullScreen: createChannel<void, void>(IPC_CHANNELS.toggleFullScreen, isUndefined),
  setAlwaysOnTop: createChannel<boolean, void>(IPC_CHANNELS.setAlwaysOnTop, isBoolean),
  openWindow: createChannel<string, boolean>(IPC_CHANNELS.openWindow, isString),
  openExternal: createChannel<string, boolean>(IPC_CHANNELS.openExternal, isString),
  openFile: createChannel<void, string | null>(IPC_CHANNELS.openFile, isUndefined),
  openFiles: createChannel<void, readonly string[]>(IPC_CHANNELS.openFiles, isUndefined),
  openDirectory: createChannel<void, string | null>(IPC_CHANNELS.openDirectory, isUndefined),
  saveFile: createChannel<SaveDialogRequest, string | null>(IPC_CHANNELS.saveFile, isSaveDialogRequest),
  confirm: createChannel<ConfirmDialogOptions, boolean>(IPC_CHANNELS.confirm, isConfirmDialogOptions),
  pickFile: createChannel<void, string | null>(IPC_CHANNELS.pickFile, isUndefined),
  pickDirectory: createChannel<void, string | null>(IPC_CHANNELS.pickDirectory, isUndefined),
  fsReadText: createChannel<{ path: string }, string>(IPC_CHANNELS.fsReadText, isPathRequest),
  fsWriteText: createChannel<{ path: string; content: string }, void>(IPC_CHANNELS.fsWriteText, isWriteRequest),
  fsReadJson: createChannel<{ path: string }, unknown>(IPC_CHANNELS.fsReadJson, isPathRequest),
  fsWriteJson: createChannel<{ path: string; value: unknown }, void>(IPC_CHANNELS.fsWriteJson, isJsonWriteRequest),
  fsList: createChannel<{ path: string }, readonly unknown[]>(IPC_CHANNELS.fsList, isPathRequest),
  fsExists: createChannel<{ path: string }, boolean>(IPC_CHANNELS.fsExists, isPathRequest),
  fsCopy: createChannel<{ source: string; destination: string }, void>(IPC_CHANNELS.fsCopy, isPathPairRequest),
  fsMove: createChannel<{ source: string; destination: string }, void>(IPC_CHANNELS.fsMove, isPathPairRequest),
  fsRemove: createChannel<{ path: string }, void>(IPC_CHANNELS.fsRemove, isPathRequest),
  fsMime: createChannel<{ path: string }, string>(IPC_CHANNELS.fsMime, isPathRequest),
  fsRecentAdd: createChannel<{ path: string }, void>(IPC_CHANNELS.fsRecentAdd, isPathRequest),
  fsRecentList: createChannel<void, readonly string[]>(IPC_CHANNELS.fsRecentList, isUndefined),
  fsRecentRemove: createChannel<{ path: string }, void>(IPC_CHANNELS.fsRecentRemove, isPathRequest),
  fsRecentClear: createChannel<void, void>(IPC_CHANNELS.fsRecentClear, isUndefined),
  fsWatchStart: createChannel<{ path: string }, string>(IPC_CHANNELS.fsWatchStart, isPathRequest),
  fsWatchStop: createChannel<{ id: string }, void>(IPC_CHANNELS.fsWatchStop, (value): value is { id: string } => isRecord(value) && typeof value.id === 'string'),
  fsWatchEvent: createChannel<{ type: string; fileName: string | null }, void>(IPC_CHANNELS.fsWatchEvent, isWatchEvent),
  storeGet: createChannel<void, unknown>(IPC_CHANNELS.storeGet, isUndefined),
  storeSet: createChannel<unknown, void>(IPC_CHANNELS.storeSet, (value): value is unknown => value !== undefined),
  storeChanged: createChannel<unknown, void>(IPC_CHANNELS.storeChanged, (value): value is unknown => value !== undefined),
  preferencesGet: createChannel<{ key: string }, unknown>(
    IPC_CHANNELS.preferencesGet,
    (value): value is { key: string } => isRecord(value) && typeof value.key === 'string'
  ),
  preferencesSet: createChannel<{ key: string; value: unknown }, void>(
    IPC_CHANNELS.preferencesSet,
    (value): value is { key: string; value: unknown } => isRecord(value) && typeof value.key === 'string'
  ),
  preferencesAll: createChannel<void, unknown>(IPC_CHANNELS.preferencesAll, isUndefined),
  shellOpenPath: createChannel<{ path: string }, string>(IPC_CHANNELS.shellOpenPath, isPathRequest),
  shellShowItemInFolder: createChannel<{ path: string }, void>(IPC_CHANNELS.shellShowItemInFolder, isPathRequest),
  shellTrashItem: createChannel<{ path: string }, void>(IPC_CHANNELS.shellTrashItem, isPathRequest),
  notify: createChannel<{ title: string; body: string; silent?: boolean }, boolean>(IPC_CHANNELS.notify, isNotificationRequest),
  clipboardClear: createChannel<void, void>(IPC_CHANNELS.clipboardClear, isUndefined),
  clipboardHasImage: createChannel<void, boolean>(IPC_CHANNELS.clipboardHasImage, isUndefined),
  clipboardHasHtml: createChannel<void, boolean>(IPC_CHANNELS.clipboardHasHtml, isUndefined),
  clipboardReadImage: createChannel<void, Uint8Array>(IPC_CHANNELS.clipboardReadImage, isUndefined),
  clipboardWriteImage: createChannel<Uint8Array, void>(IPC_CHANNELS.clipboardWriteImage, isBytes),
  systemInfo: createChannel<void, unknown>(IPC_CHANNELS.systemInfo, isUndefined),
  powerStatus: createChannel<void, unknown>(IPC_CHANNELS.powerStatus, isUndefined),
  networkStatus: createChannel<void, unknown>(IPC_CHANNELS.networkStatus, isUndefined),
  downloadStart: createChannel<{ url: string; savePath?: string }, void>(IPC_CHANNELS.downloadStart, isDownloadRequest),
  downloadCancelAll: createChannel<void, void>(IPC_CHANNELS.downloadCancelAll, isUndefined),
  transferProgress: createChannel<unknown, void>(IPC_CHANNELS.transferProgress, (value): value is unknown => value !== undefined),
  powerSuspend: createChannel<void, void>(IPC_CHANNELS.powerSuspend, isUndefined),
  powerResume: createChannel<void, void>(IPC_CHANNELS.powerResume, isUndefined),
  powerLock: createChannel<void, void>(IPC_CHANNELS.powerLock, isUndefined),
  powerUnlock: createChannel<void, void>(IPC_CHANNELS.powerUnlock, isUndefined),
  secretsGet: createChannel<{ key: string }, string | null>(IPC_CHANNELS.secretsGet, isKeyRequest),
  secretsSet: createChannel<{ key: string; value: string }, void>(IPC_CHANNELS.secretsSet, isSecretWriteRequest),
  secretsHas: createChannel<{ key: string }, boolean>(IPC_CHANNELS.secretsHas, isKeyRequest),
  secretsRemove: createChannel<{ key: string }, void>(IPC_CHANNELS.secretsRemove, isKeyRequest),
  authLogin: createChannel<{ username: string; password: string }, unknown>(IPC_CHANNELS.authLogin, isCredentials),
  authLogout: createChannel<void, void>(IPC_CHANNELS.authLogout, isUndefined),
  authSession: createChannel<void, unknown>(IPC_CHANNELS.authSession, isUndefined),
  authChanged: createChannel<unknown, void>(IPC_CHANNELS.authChanged, (value): value is unknown => value !== undefined),
  authTokens: createChannel<void, unknown>(IPC_CHANNELS.authTokens, isUndefined),
  updateCheck: createChannel<void, unknown>(IPC_CHANNELS.updateCheck, isUndefined),
  updateDownload: createChannel<void, void>(IPC_CHANNELS.updateDownload, isUndefined),
  updateInstall: createChannel<void, void>(IPC_CHANNELS.updateInstall, isUndefined),
  updateRollback: createChannel<void, void>(IPC_CHANNELS.updateRollback, isUndefined),
  updateChannel: createChannel<string, void>(IPC_CHANNELS.updateChannel, isString),
  updateProgress: createChannel<number, void>(IPC_CHANNELS.updateProgress, isNumber),
  readClipboard: createChannel<void, string>(IPC_CHANNELS.readClipboard, isUndefined),
  writeClipboard: createChannel<string, void>(IPC_CHANNELS.writeClipboard, isString),
  contextMenuShow: createChannel<ContextMenuRequest, string | null>(IPC_CHANNELS.contextMenuShow, isContextMenuRequest),
  setBadge: createChannel<number, void>(IPC_CHANNELS.setBadge, isNumber),
  requestAttention: createChannel<boolean, void>(IPC_CHANNELS.requestAttention, isBoolean),
  setProgress: createChannel<number, void>(IPC_CHANNELS.setProgress, isNumber),
  flashFrame: createChannel<boolean, void>(IPC_CHANNELS.flashFrame, isBoolean),
  deepLink: createChannel<string, void>(IPC_CHANNELS.deepLink, isString)
} as const

export interface IpcSender {
  getURL(): string
}

export interface IpcEvent {
  readonly sender: IpcSender
}

export interface IpcMainLike {
  handle(channel: string, listener: (event: IpcEvent, ...args: unknown[]) => unknown): void
  removeHandler(channel: string): void
}

export interface IpcRendererLike {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
}

export interface IpcHandlerContext<Request> {
  readonly request: Request
  readonly senderUrl: string
}

export interface IpcRegistration<Request = unknown, Response = unknown> {
  readonly channel: IpcChannel<Request, Response>
  handle(context: IpcHandlerContext<Request>): Response | Promise<Response>
}

export interface IpcRegistryOptions {
  readonly origin: string
  readonly logger?: Logger | undefined
  readonly tracer?: Tracer | undefined
  readonly metrics?: Metrics | undefined
}

export interface IpcRegistry {
  register<Request, Response>(registration: IpcRegistration<Request, Response>): () => void
  registerAll(registrations: readonly IpcRegistration<unknown, unknown>[]): () => void
  dispose(): void
}

export function createIpcRegistry(ipcMain: IpcMainLike, options: IpcRegistryOptions): IpcRegistry {
  const channels = new Set<string>()

  const unregister = (name: string): void => {
    if (!channels.delete(name)) return
    ipcMain.removeHandler(name)
  }

  const invokeHandler = async <Request, Response>(
    channel: IpcChannel<Request, Response>,
    handle: (context: IpcHandlerContext<Request>) => Response | Promise<Response>,
    event: IpcEvent,
    args: unknown[]
  ): Promise<Response> => {
    const senderUrl = event.sender.getURL()
    if (!isTrustedSender({ url: senderUrl }, options.origin)) {
      options.logger?.warn('Rejected IPC from untrusted sender', { channel: channel.name, senderUrl })
      throw new Error('Untrusted IPC sender')
    }
    const request = args[0]
    if (!channel.validate(request)) {
      options.logger?.warn('Rejected IPC with invalid payload', { channel: channel.name })
      throw new Error(`Invalid IPC payload for ${channel.name}`)
    }
    return handle({ request, senderUrl })
  }

  const register = <Request, Response>(registration: IpcRegistration<Request, Response>): (() => void) => {
    const { channel, handle } = registration
    if (channels.has(channel.name)) throw new Error(`IPC channel already registered: ${channel.name}`)
    channels.add(channel.name)
    const traced = options.tracer
      ? options.tracer.wrapIpc(channel.name, (event: IpcEvent, args: unknown[]) => invokeHandler(channel, handle, event, args))
      : null
    ipcMain.handle(channel.name, async (event, ...args) => {
      const invoke = async (): Promise<Response> => {
        const start = Date.now()
        try {
          return traced ? await traced(event, args) : await invokeHandler(channel, handle, event, args)
        } finally {
          options.metrics?.observe('ipc.duration', Date.now() - start)
          options.metrics?.increment('ipc.calls')
        }
      }
      return invoke()
    })
    return () => unregister(channel.name)
  }

  return {
    register,
    registerAll: (registrations) => {
      const disposers = registrations.map((registration) => register(registration))
      return () => {
        for (const dispose of disposers) dispose()
      }
    },
    dispose: () => {
      for (const name of channels) ipcMain.removeHandler(name)
      channels.clear()
    }
  }
}

export function createIpcInvoker<Request, Response>(
  channel: IpcChannel<Request, Response>,
  renderer: IpcRendererLike
): (request: Request) => Promise<Response> {
  return (request) => renderer.invoke(channel.name, request) as Promise<Response>
}

export interface DesktopAPI {
  app: {
    getVersion: () => Promise<string>
    getLocale: () => Promise<string>
    setBadge: (count: number) => void
    requestAttention: (critical?: boolean) => void
    setProgress: (progress: number) => void
    flash: (flag: boolean) => void
    onDeepLink: (listener: (route: string, id: string | null) => void) => () => void
  }
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
    toggleFullScreen: () => void
    setAlwaysOnTop: (flag: boolean) => void
    open: (id: string) => Promise<boolean>
  }
  shell: {
    openExternal: (url: string) => Promise<boolean>
    openPath: (path: string) => Promise<string>
    showItemInFolder: (path: string) => Promise<void>
    trashItem: (path: string) => Promise<void>
  }
  dialog: {
    openFile: () => Promise<string | null>
    openFiles: () => Promise<readonly string[]>
    openDirectory: () => Promise<string | null>
    saveFile: (request?: SaveDialogRequest) => Promise<string | null>
    confirm: (options: ConfirmDialogOptions) => Promise<boolean>
  }
  contextMenu: { show: (request: ContextMenuRequest) => Promise<string | null> }
  clipboard: {
    readText: () => Promise<string>
    writeText: (value: string) => Promise<void>
    readImage: () => Promise<Uint8Array>
    writeImage: (png: Uint8Array) => Promise<void>
    hasImage: () => Promise<boolean>
    hasHtml: () => Promise<boolean>
    clear: () => Promise<void>
  }
  notifications: { show: (options: { title: string; body: string; silent?: boolean }) => Promise<boolean> }
  feedback: { submit: (request: FeedbackRequest) => Promise<boolean> }
  crash: { report: (request: CrashReportRequest) => Promise<boolean> }
  system: { info: <T = SystemInfo>() => Promise<T> }
  power: {
    status: <T = BatteryStatus>() => Promise<T>
    onSuspend: (listener: () => void) => () => void
    onResume: (listener: () => void) => () => void
  }
  network: {
    status: <T = NetworkStatus>() => Promise<T>
    onChange: (listener: (online: boolean) => void) => () => void
  }
  transfers: {
    download: (url: string, savePath?: string) => Promise<void>
    cancelAll: () => Promise<void>
    onProgress: (listener: (progress: unknown) => void) => () => void
  }
  secrets: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    has: (key: string) => Promise<boolean>
    remove: (key: string) => Promise<void>
  }
  auth: {
    login: (credentials: { username: string; password: string }) => Promise<unknown>
    logout: () => Promise<void>
    session: () => Promise<unknown>
    tokens: () => Promise<unknown>
    onChanged: (listener: (session: unknown) => void) => () => void
  }
  updates: {
    check: <T = UpdateCheckResult>() => Promise<T>
    download: () => Promise<void>
    install: () => Promise<void>
    rollback: () => Promise<void>
    setChannel: (channel: string) => Promise<void>
    onProgress: (listener: (progress: number) => void) => () => void
  }
  fs: {
    pickFile: () => Promise<string | null>
    pickDirectory: () => Promise<string | null>
    readText: (path: string) => Promise<string>
    writeText: (path: string, content: string) => Promise<void>
    readJson: <T>(path: string) => Promise<T>
    writeJson: (path: string, value: unknown) => Promise<void>
    list: (path: string) => Promise<readonly FileSystemEntry[]>
    exists: (path: string) => Promise<boolean>
    copy: (source: string, destination: string) => Promise<void>
    move: (source: string, destination: string) => Promise<void>
    remove: (path: string) => Promise<void>
    mime: (path: string) => Promise<string>
    pathForFile: (file: File) => string
  }
  recentFiles: {
    add: (path: string) => Promise<void>
    list: () => Promise<readonly string[]>
    remove: (path: string) => Promise<void>
    clear: () => Promise<void>
  }
  store: {
    get: <T>() => Promise<T>
    set: (value: unknown) => Promise<void>
    onChange: (listener: (value: unknown) => void) => () => void
  }
  preferences: {
    get: <T>(key: string) => Promise<T>
    set: (key: string, value: unknown) => Promise<void>
    all: <T>() => Promise<T>
  }
}

export interface FileSystemEntry {
  readonly name: string
  readonly path: string
  readonly isDirectory: boolean
  readonly size: number
}
