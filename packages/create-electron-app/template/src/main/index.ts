import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'

function createWindow() { const window = new BrowserWindow({ width: 1200, height: 800, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true } }); void window.loadFile(join(__dirname, '../renderer/main_window/index.html')) }
app.whenReady().then(createWindow).catch((error) => { console.error(error); app.quit() })
