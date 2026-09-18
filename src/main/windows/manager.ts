import { BrowserWindow } from 'electron'

export type WindowId = 'main' | 'settings' | 'about'

export function createWindowManager(): { open(id: WindowId, factory: () => BrowserWindow): BrowserWindow; close(id: WindowId): void } {
  const windows = new Map<WindowId, BrowserWindow>()
  return {
    open: (id, factory) => { const current = windows.get(id); if (current && !current.isDestroyed()) { current.show(); current.focus(); return current }; const window = factory(); windows.set(id, window); window.once('closed', () => windows.delete(id)); return window },
    close: (id) => { windows.get(id)?.close() }
  }
}
