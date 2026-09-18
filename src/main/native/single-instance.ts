import { app, BrowserWindow } from 'electron'

export function acquireSingleInstance(onSecondInstance: (commandLine: string[]) => void): boolean {
  const acquired = app.requestSingleInstanceLock()
  if (!acquired) { app.quit(); return false }
  app.on('second-instance', (_event, commandLine) => { onSecondInstance(commandLine); BrowserWindow.getAllWindows()[0]?.show() })
  return true
}
