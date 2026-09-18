import { autoUpdater } from 'electron'
import { createUpdateService, type UpdateService } from './service'

export function createElectronUpdateService(): UpdateService { return createUpdateService({ checkForUpdates: async () => { await autoUpdater.checkForUpdates() }, downloadUpdate: async () => { await autoUpdater.checkForUpdates() }, quitAndInstall: () => autoUpdater.quitAndInstall() }) }
