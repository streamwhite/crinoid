export interface GlobalShortcutPort {
  register(accelerator: string, callback: () => void): boolean
  unregister(accelerator: string): void
  unregisterAll(): void
  isRegistered(accelerator: string): boolean
}

export type ShortcutAction = () => void

export interface ShortcutManager {
  register(accelerator: string, action: ShortcutAction): boolean
  registerAll(bindings: Readonly<Record<string, ShortcutAction>>): void
  unregister(accelerator: string): void
  isRegistered(accelerator: string): boolean
  dispose(): void
}

export function createShortcutManager(shortcuts: GlobalShortcutPort): ShortcutManager {
  const owned = new Set<string>()

  const register = (accelerator: string, action: ShortcutAction): boolean => {
    const registered = shortcuts.register(accelerator, action)
    if (registered) owned.add(accelerator)
    return registered
  }

  return {
    register,
    registerAll: (bindings) => {
      for (const [accelerator, action] of Object.entries(bindings)) register(accelerator, action)
    },
    unregister: (accelerator) => {
      if (owned.delete(accelerator)) shortcuts.unregister(accelerator)
    },
    isRegistered: (accelerator) => shortcuts.isRegistered(accelerator),
    dispose: () => {
      for (const accelerator of owned) shortcuts.unregister(accelerator)
      owned.clear()
    }
  }
}
