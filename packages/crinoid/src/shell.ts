import { isAllowedExternalUrl } from './security.js'

export interface ShellPort {
  openExternal(url: string): Promise<void>
  openPath(path: string): Promise<string>
  showItemInFolder(path: string): void
  trashItem(path: string): Promise<void>
}

export interface ShellService {
  openExternal(url: string): Promise<boolean>
  openPath(path: string): Promise<string>
  showItemInFolder(path: string): void
  trashItem(path: string): Promise<void>
}

export function createShellService(shell: ShellPort): ShellService {
  return {
    openExternal: async (url) => {
      if (!isAllowedExternalUrl(url)) return false
      await shell.openExternal(url)
      return true
    },
    openPath: (path) => shell.openPath(path),
    showItemInFolder: (path) => shell.showItemInFolder(path),
    trashItem: (path) => shell.trashItem(path)
  }
}
