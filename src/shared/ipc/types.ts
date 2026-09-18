export const IPC_CHANNELS = {
  getVersion: 'app.get-version',
  minimize: 'window.minimize',
  maximize: 'window.maximize',
  close: 'window.close',
  openExternal: 'shell.open-external',
  openFile: 'dialog.open-file',
  readClipboard: 'clipboard.read-text',
  writeClipboard: 'clipboard.write-text',
  deepLink: 'app.deep-link'
} as const

export interface DesktopAPI {
  app: { getVersion: () => Promise<string>; onDeepLink: (listener: (route: string, id: string | null) => void) => () => void }
  window: { minimize: () => void; maximize: () => void; close: () => void }
  shell: { openExternal: (url: string) => Promise<boolean> }
  dialog: { openFile: () => Promise<string | null> }
  clipboard: { readText: () => Promise<string>; writeText: (value: string) => Promise<void> }
}
