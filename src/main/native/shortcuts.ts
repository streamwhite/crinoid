import { globalShortcut } from 'electron'

export function registerShortcut(accelerator: string, action: () => void): void { globalShortcut.register(accelerator, action) }
export function unregisterShortcuts(): void { globalShortcut.unregisterAll() }
