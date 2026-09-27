export type MenuItemTemplate = Record<string, unknown>

export interface BuiltMenu {
  popup(options: unknown): void
}

export interface MenuPort {
  buildFromTemplate(template: MenuItemTemplate[]): BuiltMenu
  setApplicationMenu(menu: BuiltMenu | null): void
}

export interface ContextMenuPosition {
  readonly window?: unknown
  readonly x?: number
  readonly y?: number
}

export interface MenuService {
  setApplicationMenu(template: MenuItemTemplate[]): void
  popupContextMenu(template: MenuItemTemplate[], position?: ContextMenuPosition): void
}

export function createMenuService(menu: MenuPort): MenuService {
  return {
    setApplicationMenu: (template) => {
      menu.setApplicationMenu(template.length === 0 ? null : menu.buildFromTemplate(template))
    },
    popupContextMenu: (template, position = {}) => {
      menu.buildFromTemplate(template).popup(position)
    }
  }
}

export function defaultApplicationMenuTemplate(isMacOS: boolean): MenuItemTemplate[] {
  const base: MenuItemTemplate[] = [{ role: 'fileMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }]
  return isMacOS ? [{ role: 'appMenu' }, ...base] : base
}
