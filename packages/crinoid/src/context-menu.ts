import type { MenuItemTemplate } from './menu.js'

export interface ContextMenuItem {
  readonly id: string
  readonly label: string
  readonly enabled?: boolean | undefined
  readonly type?: 'normal' | 'separator' | undefined
}

export interface ContextMenuRequest {
  readonly items: readonly ContextMenuItem[]
  readonly x: number
  readonly y: number
}

export interface BuiltContextMenu {
  popup(options: { window?: never; x?: number; y?: number; callback?: () => void }): void
}

export interface ContextMenuPort {
  buildFromTemplate(template: MenuItemTemplate[]): BuiltContextMenu
}

export interface ContextMenuHandlerOptions {
  readonly menu: ContextMenuPort
  readonly resolveWindow?: (() => unknown | undefined) | undefined
}

export type ContextMenuHandler = (request: ContextMenuRequest) => Promise<string | null>

export function createContextMenuHandler(options: ContextMenuHandlerOptions): ContextMenuHandler {
  const { menu, resolveWindow } = options
  return (request) =>
    new Promise<string | null>((resolve) => {
      let selected: string | null = null
      const template = request.items.map((item) =>
        toTemplate(item, (id) => {
          selected = id
        })
      )
      const window = resolveWindow?.()
      menu.buildFromTemplate(template).popup({
        ...(window == null ? {} : { window: window as never }),
        x: request.x,
        y: request.y,
        callback: () => resolve(selected)
      })
    })
}

function toTemplate(item: ContextMenuItem, onSelect: (id: string) => void): MenuItemTemplate {
  if (item.type === 'separator') return { type: 'separator' }
  return { id: item.id, label: item.label, enabled: item.enabled ?? true, click: () => onSelect(item.id) }
}

export function isContextMenuRequest(value: unknown): value is ContextMenuRequest {
  if (!isRecord(value)) return false
  if (typeof value.x !== 'number' || typeof value.y !== 'number') return false
  if (!Array.isArray(value.items)) return false
  return value.items.every(isContextMenuItem)
}

function isContextMenuItem(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.label !== 'string') return false
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') return false
  if (value.type !== undefined && value.type !== 'normal' && value.type !== 'separator') return false
  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
