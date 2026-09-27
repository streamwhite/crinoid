import { join } from 'node:path'
import { app } from 'electron'
import { createDesktopConfig } from 'crinoid/config'
import { createMainProcess } from 'crinoid/main'

const config = createDesktopConfig({ appName: 'Reference App' })

createMainProcess({
  config,
  window: {
    preloadPath: join(__dirname, 'preload.js'),
    rendererFile: join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    devServerUrl: MAIN_WINDOW_VITE_DEV_SERVER_URL
  },
  observability: {
    logFile: join(app.getPath('userData'), 'logs', 'app.log')
  }
})
