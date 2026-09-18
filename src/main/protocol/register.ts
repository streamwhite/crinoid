import { app, BrowserWindow } from 'electron'
import { parseDeepLink } from './deep-link'

const PROTOCOL_NAME = 'myapp'

export function registerDeepLink(url: string | undefined): void {
  const link = url ? parseDeepLink(url) : null
  if (!link) return
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send('app.deep-link', link.route, link.id)
}

export function configureDeepLink(): void { app.setAsDefaultProtocolClient(PROTOCOL_NAME); const initialUrl = process.argv.find((argument) => argument.startsWith(`${PROTOCOL_NAME}:`)); const window = BrowserWindow.getAllWindows()[0]; if (initialUrl && window) window.webContents.once('did-finish-load', () => registerDeepLink(initialUrl)) }
