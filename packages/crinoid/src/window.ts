import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface WindowBounds {
  width: number
  height: number
  x?: number | undefined
  y?: number | undefined
}

export interface WindowState extends WindowBounds {
  isMaximized: boolean
  isFullScreen: boolean
}

export const DEFAULT_WINDOW_STATE: WindowState = { width: 1200, height: 800, isMaximized: false, isFullScreen: false }

export async function loadWindowState(filePath: string): Promise<WindowState> {
  try {
    const value = JSON.parse(await readFile(filePath, 'utf8')) as Partial<WindowState>
    return { ...DEFAULT_WINDOW_STATE, ...value }
  } catch {
    return DEFAULT_WINDOW_STATE
  }
}

export async function saveWindowState(filePath: string, state: WindowState): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8')
}

export interface DisplayWorkArea {
  x: number
  y: number
  width: number
  height: number
}

const MIN_VISIBLE_PIXELS = 48

export function ensureVisibleOnDisplays(state: WindowBounds, workAreas: readonly DisplayWorkArea[]): WindowBounds {
  if (state.x === undefined || state.y === undefined) return state
  if (workAreas.length === 0) return state
  if (workAreas.some((area) => isVisible(state, area))) return state
  const { x: _x, y: _y, ...size } = state
  return size
}

function isVisible(bounds: WindowBounds, area: DisplayWorkArea): boolean {
  const x = bounds.x ?? 0
  const y = bounds.y ?? 0
  const overlapX = Math.min(x + bounds.width, area.x + area.width) - Math.max(x, area.x)
  const overlapY = Math.min(y + bounds.height, area.y + area.height) - Math.max(y, area.y)
  return overlapX >= MIN_VISIBLE_PIXELS && overlapY >= MIN_VISIBLE_PIXELS
}

export interface WindowChromeOptions {
  readonly frame?: boolean
  readonly titleBarStyle?: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover'
  readonly titleBarOverlay?: boolean | { readonly color?: string; readonly symbolColor?: string; readonly height?: number }
  readonly trafficLightPosition?: { readonly x: number; readonly y: number }
  readonly transparent?: boolean
  readonly backgroundColor?: string
  readonly minWidth?: number
  readonly minHeight?: number
  readonly resizable?: boolean
  readonly fullscreen?: boolean
  readonly alwaysOnTop?: boolean
}

export interface WindowWebContents {
  send(channel: string, ...args: unknown[]): void
}

export interface WindowLike {
  show(): void
  focus(): void
  close(): void
  isDestroyed(): boolean
  once(event: string, listener: () => void): void
}

export interface ManagedWindow extends WindowLike {
  readonly webContents?: WindowWebContents | undefined
}

export interface WindowRegistry<T extends ManagedWindow = ManagedWindow> {
  open(id: string, create: () => T): T
  close(id: string): void
  closeAll(): void
  get(id: string): T | undefined
  ids(): readonly string[]
  size(): number
  broadcast(channel: string, ...args: unknown[]): number
}

export function createWindowRegistry<T extends ManagedWindow = ManagedWindow>(): WindowRegistry<T> {
  const windows = new Map<string, T>()

  const open = (id: string, create: () => T): T => {
    const current = windows.get(id)
    if (current && !current.isDestroyed()) {
      current.show()
      current.focus()
      return current
    }
    const window = create()
    windows.set(id, window)
    window.once('closed', () => {
      if (windows.get(id) === window) windows.delete(id)
    })
    return window
  }

  return {
    open,
    close: (id) => windows.get(id)?.close(),
    closeAll: () => {
      for (const window of [...windows.values()]) window.close()
    },
    get: (id) => windows.get(id),
    ids: () => [...windows.keys()],
    size: () => windows.size,
    broadcast: (channel, ...args) => {
      let delivered = 0
      for (const window of windows.values()) {
        if (window.isDestroyed()) continue
        window.webContents?.send(channel, ...args)
        delivered += 1
      }
      return delivered
    }
  }
}
