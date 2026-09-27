import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { DesktopMainDeps } from '../main.js'
import { createCollectingLogger } from './logger.js'
import { createFakeIpcMain, type FakeIpcMain } from './ipc.js'

type Listener = (...args: unknown[]) => void

interface Emitter {
  on(event: string, listener: Listener): unknown
  off(event: string, listener: Listener): unknown
  emit(event: string, ...args: unknown[]): void
  listenerCount(event: string): number
}

function createEmitter(): Emitter {
  const listeners = new Map<string, Set<Listener>>()
  const setFor = (event: string): Set<Listener> => {
    const set = listeners.get(event) ?? new Set<Listener>()
    listeners.set(event, set)
    return set
  }
  return {
    on: (event, listener) => setFor(event).add(listener),
    off: (event, listener) => setFor(event).delete(listener),
    emit: (event, ...args) => {
      for (const listener of [...(listeners.get(event) ?? [])]) listener(...args)
    },
    listenerCount: (event) => listeners.get(event)?.size ?? 0
  }
}

export interface MockWebContents {
  readonly messages: Array<{ channel: string; args: unknown[] }>
  readonly url: string
  send(channel: string, ...args: unknown[]): void
  getURL(): string
  on(event: string, listener: Listener): void
  setWindowOpenHandler(handler: (details: { url: string }) => unknown): void
}

export interface MockWindow {
  readonly options: Record<string, unknown>
  readonly webContents: MockWebContents
  shown: boolean
  focused: boolean
  minimized: boolean
  maximized: boolean
  fullScreen: boolean
  alwaysOnTop: boolean
  progress: number
  flashed: boolean
  destroyed: boolean
  show(): void
  hide(): void
  focus(): void
  minimize(): void
  maximize(): void
  unmaximize(): void
  restore(): void
  close(): void
  isMaximized(): boolean
  isMinimized(): boolean
  isFullScreen(): boolean
  isDestroyed(): boolean
  setFullScreen(flag: boolean): void
  setAlwaysOnTop(flag: boolean): void
  setProgressBar(progress: number): void
  flashFrame(flag: boolean): void
  getSize(): [number, number]
  getPosition(): [number, number]
  loadURL(url: string): Promise<void>
  loadFile(file: string): Promise<void>
  on(event: string, listener: Listener): void
  emit(event: string, ...args: unknown[]): void
}

export interface MockBrowserWindowConstructor {
  new (options?: Record<string, unknown>): MockWindow
  getAllWindows(): MockWindow[]
  getFocusedWindow(): MockWindow | undefined
  fromWebContents(contents: MockWebContents): MockWindow | undefined
}

export interface MockDialog {
  readonly openResults: Array<{ canceled: boolean; filePaths: string[] }>
  readonly saveResults: Array<{ canceled: boolean; filePath?: string }>
  readonly messageResults: Array<{ response: number }>
  showOpenDialog(window: unknown, options: unknown): Promise<{ canceled: boolean; filePaths: string[] }>
  showSaveDialog(window: unknown, options: unknown): Promise<{ canceled: boolean; filePath?: string }>
  showMessageBox(window: unknown, options: unknown): Promise<{ response: number }>
}

export interface MockClipboard {
  text: string
  image: boolean
  readText(): string
  writeText(value: string): void
  hasImage(): boolean
  clear(): void
}

export interface MockShell {
  readonly openedExternal: string[]
  readonly openedPaths: string[]
  readonly revealedItems: string[]
  readonly trashedItems: string[]
  openExternal(url: string): Promise<void>
  openPath(path: string): Promise<string>
  showItemInFolder(path: string): void
  trashItem(path: string): Promise<void>
}

export interface MockNotificationConstructor {
  new (options: { title: string; body: string }): {
    readonly options: { title: string; body: string }
    shown: boolean
    show(): void
    close(): void
    on(event: string, listener: Listener): void
  }
  isSupported(): boolean
  readonly instances: Array<{ options: { title: string; body: string }; shown: boolean; show(): void; close(): void; on(event: string, listener: Listener): void }>
}

export interface MockMenu {
  lastApplicationMenu: unknown
  buildFromTemplate(template: unknown[]): { template: unknown[]; popup(): void }
  setApplicationMenu(menu: unknown): void
}

export interface MockTrayConstructor {
  new (icon: string): object
  readonly instances: object[]
}

export interface MockSafeStorage {
  available: boolean
  isEncryptionAvailable(): boolean
  encryptString(value: string): Buffer
  decryptString(value: Buffer): string
}

export interface ElectronMock {
  readonly app: Record<string, unknown> & Emitter
  readonly BrowserWindow: MockBrowserWindowConstructor
  readonly dialog: MockDialog
  readonly clipboard: MockClipboard
  readonly shell: MockShell
  readonly Notification: MockNotificationConstructor
  readonly Menu: MockMenu
  readonly Tray: MockTrayConstructor
  readonly safeStorage: MockSafeStorage
  readonly ipcMain: FakeIpcMain
  readonly session: { defaultSession: { setPermissionRequestHandler(handler: unknown): void; setPermissionCheckHandler(handler: unknown): void } }
  readonly globalShortcut: {
    register(accelerator: string, callback: () => void): boolean
    unregister(accelerator: string): void
    unregisterAll(): void
    isRegistered(accelerator: string): boolean
    trigger(accelerator: string): void
  }
  readonly screen: { getAllDisplays(): Array<{ workArea: { x: number; y: number; width: number; height: number } }> }
  readonly powerMonitor: Emitter & { isOnBatteryPower(): boolean }
  readonly electronVersion: string
}

function createWebContents(): MockWebContents {
  const emitter = createEmitter()
  const messages: Array<{ channel: string; args: unknown[] }> = []
  return {
    messages,
    url: 'file:///app/index.html',
    send: (channel, ...args) => {
      messages.push({ channel, args })
      emitter.emit('message', channel, ...args)
    },
    getURL: () => 'file:///app/index.html',
    on: (event, listener) => {
      emitter.on(event, listener)
    },
    setWindowOpenHandler: () => {}
  }
}

export function createBrowserWindowConstructor(): MockBrowserWindowConstructor {
  const instances: MockWindow[] = []

  class MockBrowserWindow implements MockWindow {
    static getAllWindows(): MockWindow[] {
      return instances.filter((window) => !window.destroyed)
    }

    static getFocusedWindow(): MockWindow | undefined {
      return instances.find((window) => window.focused && !window.destroyed)
    }

    static fromWebContents(contents: MockWebContents): MockWindow | undefined {
      return instances.find((window) => window.webContents === contents)
    }

    readonly options: Record<string, unknown>
    readonly webContents: MockWebContents
    shown = false
    focused = false
    minimized = false
    maximized = false
    fullScreen = false
    alwaysOnTop = false
    progress = -1
    flashed = false
    destroyed = false
    private readonly size: [number, number]
    private readonly position: [number, number]
    private readonly listeners = createEmitter()

    constructor(options: Record<string, unknown> = {}) {
      this.options = options
      this.webContents = createWebContents()
      this.size = [numberOr(options.width, 1024), numberOr(options.height, 768)]
      this.position = [numberOr(options.x, 0), numberOr(options.y, 0)]
      instances.push(this)
    }

    show(): void {
      this.shown = true
    }

    hide(): void {
      this.shown = false
    }

    focus(): void {
      this.focused = true
    }

    minimize(): void {
      this.minimized = true
    }

    maximize(): void {
      this.maximized = true
      this.minimized = false
    }

    unmaximize(): void {
      this.maximized = false
    }

    restore(): void {
      this.minimized = false
    }

    close(): void {
      this.destroyed = true
      this.emit('closed')
    }

    isMaximized(): boolean {
      return this.maximized
    }

    isMinimized(): boolean {
      return this.minimized
    }

    isFullScreen(): boolean {
      return this.fullScreen
    }

    isDestroyed(): boolean {
      return this.destroyed
    }

    setFullScreen(flag: boolean): void {
      this.fullScreen = flag
    }

    setAlwaysOnTop(flag: boolean): void {
      this.alwaysOnTop = flag
    }

    setProgressBar(progress: number): void {
      this.progress = progress
    }

    flashFrame(flag: boolean): void {
      this.flashed = flag
    }

    getSize(): [number, number] {
      return this.size
    }

    getPosition(): [number, number] {
      return this.position
    }

    loadURL(): Promise<void> {
      return Promise.resolve()
    }

    loadFile(): Promise<void> {
      return Promise.resolve()
    }

    on(event: string, listener: Listener): void {
      this.listeners.on(event, listener)
    }

    emit(event: string, ...args: unknown[]): void {
      this.listeners.emit(event, ...args)
    }
  }

  return MockBrowserWindow as unknown as MockBrowserWindowConstructor
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

export function createMockDialog(): MockDialog {
  const openResults: Array<{ canceled: boolean; filePaths: string[] }> = []
  const saveResults: Array<{ canceled: boolean; filePath?: string }> = []
  const messageResults: Array<{ response: number }> = []
  return {
    openResults,
    saveResults,
    messageResults,
    showOpenDialog: async () => openResults.shift() ?? { canceled: true, filePaths: [] },
    showSaveDialog: async () => saveResults.shift() ?? { canceled: true },
    showMessageBox: async () => messageResults.shift() ?? { response: 0 }
  }
}

function createClipboard(): MockClipboard {
  return {
    text: '',
    image: false,
    readText() {
      return this.text
    },
    writeText(value) {
      this.text = value
    },
    hasImage() {
      return this.image
    },
    clear() {
      this.text = ''
      this.image = false
    }
  }
}

function createShell(): MockShell {
  const openedExternal: string[] = []
  const openedPaths: string[] = []
  const revealedItems: string[] = []
  const trashedItems: string[] = []
  return {
    openedExternal,
    openedPaths,
    revealedItems,
    trashedItems,
    openExternal: async (url) => {
      openedExternal.push(url)
    },
    openPath: async (path) => {
      openedPaths.push(path)
      return ''
    },
    showItemInFolder: (path) => {
      revealedItems.push(path)
    },
    trashItem: async (path) => {
      trashedItems.push(path)
    }
  }
}

function createNotificationConstructor(): MockNotificationConstructor {
  const instances: Array<{ options: { title: string; body: string }; shown: boolean; show(): void; close(): void; on(event: string, listener: Listener): void }> = []

  class MockNotification {
    static readonly instances = instances

    static isSupported(): boolean {
      return true
    }

    readonly options: { title: string; body: string }
    shown = false
    private readonly listeners = createEmitter()

    constructor(options: { title: string; body: string }) {
      this.options = options
      instances.push(this)
    }

    show(): void {
      this.shown = true
    }

    close(): void {}

    on(event: string, listener: Listener): void {
      this.listeners.on(event, listener)
    }
  }

  return MockNotification as unknown as MockNotificationConstructor
}

export function createElectronMock(): ElectronMock {
  const appEmitter = createEmitter()
  const shortcuts = new Map<string, () => void>()
  const trayInstances: object[] = []

  class MockTray {
    constructor(icon: string) {
      void icon
      trayInstances.push(this)
    }
  }

  const powerMonitor = Object.assign(createEmitter(), { isOnBatteryPower: () => false })

  const app: Record<string, unknown> & Emitter = {
    name: 'Test App',
    isPackaged: false,
    getVersion: () => '0.0.0-test',
    getName: () => 'Test App',
    getLocale: () => 'en-US',
    getPath: (name: string) => join(tmpdir(), `electron-mock-${name}`),
    requestSingleInstanceLock: () => true,
    quit: () => appEmitter.emit('quit'),
    whenReady: () => Promise.resolve(),
    setAsDefaultProtocolClient: () => true,
    setBadgeCount: () => true,
    setLoginItemSettings: () => {},
    getLoginItemSettings: () => ({ openAtLogin: false }),
    on: (event: string, listener: Listener) => appEmitter.on(event, listener),
    off: (event: string, listener: Listener) => appEmitter.off(event, listener),
    emit: (event: string, ...args: unknown[]) => appEmitter.emit(event, ...args),
    listenerCount: (event: string) => appEmitter.listenerCount(event)
  }

  return {
    app,
    BrowserWindow: createBrowserWindowConstructor(),
    dialog: createMockDialog(),
    clipboard: createClipboard(),
    shell: createShell(),
    Notification: createNotificationConstructor(),
    Menu: {
      lastApplicationMenu: null as unknown,
      buildFromTemplate: (template) => ({ template, popup: () => {} }),
      setApplicationMenu(menu) {
        this.lastApplicationMenu = menu
      }
    },
    Tray: MockTray as unknown as MockTrayConstructor,
    safeStorage: {
      available: true,
      isEncryptionAvailable() {
        return this.available
      },
      encryptString: (value) => Buffer.from(`enc:${value}`, 'utf8'),
      decryptString: (value) => value.toString('utf8').replace(/^enc:/, '')
    },
    ipcMain: createFakeIpcMain(),
    session: {
      defaultSession: {
        setPermissionRequestHandler: () => {},
        setPermissionCheckHandler: () => {}
      }
    },
    globalShortcut: {
      register: (accelerator, callback) => {
        if (shortcuts.has(accelerator)) return false
        shortcuts.set(accelerator, callback)
        return true
      },
      unregister: (accelerator) => {
        shortcuts.delete(accelerator)
      },
      unregisterAll: () => shortcuts.clear(),
      isRegistered: (accelerator) => shortcuts.has(accelerator),
      trigger: (accelerator) => shortcuts.get(accelerator)?.()
    },
    screen: { getAllDisplays: () => [{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }] },
    powerMonitor,
    electronVersion: '0.0.0'
  }
}

export interface MainDepsOverrides {
  readonly logger?: DesktopMainDeps['logger']
}

export function createMainDeps(overrides: MainDepsOverrides = {}): DesktopMainDeps {
  const { logger } = createCollectingLogger()
  return {
    logger: overrides.logger ?? logger,
    shell: { openExternal: async () => {} },
    clipboard: { readText: () => '', writeText: () => {} },
    dialog: createMockDialog(),
    menu: {
      buildFromTemplate: (template) => ({ popup: () => void template }),
      setApplicationMenu: () => {}
    },
    tray: {
      setToolTip: () => {},
      setContextMenu: () => {},
      on: () => {},
      destroy: () => {}
    },
    shortcuts: {
      register: () => true,
      unregister: () => {},
      unregisterAll: () => {},
      isRegistered: () => false
    },
    taskbar: { setProgressBar: () => {}, flashFrame: () => {} },
    dock: { setBadge: () => {}, bounce: () => 0, cancelBounce: () => {} }
  }
}
