import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { DESKTOP_CHANNELS, createIpcInvoker, type DesktopAPI, type FileSystemEntry } from './ipc.js'

export function exposeDesktopApi(): void {
  const call = <I, O>(channel: Parameters<typeof createIpcInvoker<I, O>>[0]) => createIpcInvoker<I, O>(channel, ipcRenderer)
  const subscribe = (channel: string) => (listener: () => void) => {
    const handler = (): void => listener()
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }

  const desktop: DesktopAPI = {
    app: {
      getVersion: call(DESKTOP_CHANNELS.getVersion),
      getLocale: call(DESKTOP_CHANNELS.getLocale),
      setBadge: (count) => ipcRenderer.send(DESKTOP_CHANNELS.setBadge.name, count),
      requestAttention: (critical = false) => ipcRenderer.send(DESKTOP_CHANNELS.requestAttention.name, critical),
      setProgress: (progress) => ipcRenderer.send(DESKTOP_CHANNELS.setProgress.name, progress),
      flash: (flag) => ipcRenderer.send(DESKTOP_CHANNELS.flashFrame.name, flag),
      onDeepLink: (listener) => {
        const handler = (_event: IpcRendererEvent, route: string, id: string | null) => listener(route, id)
        ipcRenderer.on(DESKTOP_CHANNELS.deepLink.name, handler)
        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.deepLink.name, handler)
      }
    },
    window: {
      minimize: () => ipcRenderer.send(DESKTOP_CHANNELS.minimize.name),
      maximize: () => ipcRenderer.send(DESKTOP_CHANNELS.maximize.name),
      close: () => ipcRenderer.send(DESKTOP_CHANNELS.close.name),
      toggleFullScreen: () => ipcRenderer.send(DESKTOP_CHANNELS.toggleFullScreen.name),
      setAlwaysOnTop: (flag) => ipcRenderer.send(DESKTOP_CHANNELS.setAlwaysOnTop.name, flag),
      open: call(DESKTOP_CHANNELS.openWindow)
    },
    shell: {
      openExternal: call(DESKTOP_CHANNELS.openExternal),
      openPath: (path) => call(DESKTOP_CHANNELS.shellOpenPath)({ path }),
      showItemInFolder: (path) => call(DESKTOP_CHANNELS.shellShowItemInFolder)({ path }),
      trashItem: (path) => call(DESKTOP_CHANNELS.shellTrashItem)({ path })
    },
    dialog: {
      openFile: call(DESKTOP_CHANNELS.openFile),
      openFiles: call(DESKTOP_CHANNELS.openFiles),
      openDirectory: call(DESKTOP_CHANNELS.openDirectory),
      saveFile: (request) => call(DESKTOP_CHANNELS.saveFile)(request ?? {}),
      confirm: call(DESKTOP_CHANNELS.confirm)
    },
    contextMenu: { show: call(DESKTOP_CHANNELS.contextMenuShow) },
    clipboard: {
      readText: call(DESKTOP_CHANNELS.readClipboard),
      writeText: call(DESKTOP_CHANNELS.writeClipboard),
      readImage: call(DESKTOP_CHANNELS.clipboardReadImage),
      writeImage: call(DESKTOP_CHANNELS.clipboardWriteImage),
      hasImage: call(DESKTOP_CHANNELS.clipboardHasImage),
      hasHtml: call(DESKTOP_CHANNELS.clipboardHasHtml),
      clear: call(DESKTOP_CHANNELS.clipboardClear)
    },
    notifications: { show: call(DESKTOP_CHANNELS.notify) },
    feedback: { submit: call(DESKTOP_CHANNELS.submitFeedback) },
    crash: { report: call(DESKTOP_CHANNELS.crashReport) },
    system: { info: <T>() => call(DESKTOP_CHANNELS.systemInfo)() as Promise<T> },
    power: {
      status: <T>() => call(DESKTOP_CHANNELS.powerStatus)() as Promise<T>,
      onSuspend: subscribe(DESKTOP_CHANNELS.powerSuspend.name),
      onResume: subscribe(DESKTOP_CHANNELS.powerResume.name)
    },
    network: {
      status: <T>() => call(DESKTOP_CHANNELS.networkStatus)() as Promise<T>,
      onChange: (listener) => {
        const onOnline = () => listener(true)
        const onOffline = () => listener(false)
        window.addEventListener('online', onOnline)
        window.addEventListener('offline', onOffline)
        return () => {
          window.removeEventListener('online', onOnline)
          window.removeEventListener('offline', onOffline)
        }
      }
    },
    transfers: {
      download: (url, savePath) => call(DESKTOP_CHANNELS.downloadStart)(savePath === undefined ? { url } : { url, savePath }),
      cancelAll: call(DESKTOP_CHANNELS.downloadCancelAll),
      onProgress: (listener) => {
        const handler = (_event: IpcRendererEvent, progress: unknown) => listener(progress)
        ipcRenderer.on(DESKTOP_CHANNELS.transferProgress.name, handler)
        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.transferProgress.name, handler)
      }
    },
    secrets: {
      get: (key) => call(DESKTOP_CHANNELS.secretsGet)({ key }),
      set: (key, value) => call(DESKTOP_CHANNELS.secretsSet)({ key, value }),
      has: (key) => call(DESKTOP_CHANNELS.secretsHas)({ key }),
      remove: (key) => call(DESKTOP_CHANNELS.secretsRemove)({ key })
    },
    auth: {
      login: (credentials) => call(DESKTOP_CHANNELS.authLogin)(credentials),
      logout: call(DESKTOP_CHANNELS.authLogout),
      session: call(DESKTOP_CHANNELS.authSession),
      tokens: call(DESKTOP_CHANNELS.authTokens),
      onChanged: (listener) => {
        const handler = (_event: IpcRendererEvent, session: unknown) => listener(session)
        ipcRenderer.on(DESKTOP_CHANNELS.authChanged.name, handler)
        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.authChanged.name, handler)
      }
    },
    updates: {
      check: <T>() => call(DESKTOP_CHANNELS.updateCheck)() as Promise<T>,
      download: call(DESKTOP_CHANNELS.updateDownload),
      install: call(DESKTOP_CHANNELS.updateInstall),
      rollback: call(DESKTOP_CHANNELS.updateRollback),
      setChannel: call(DESKTOP_CHANNELS.updateChannel),
      onProgress: (listener) => {
        const handler = (_event: IpcRendererEvent, progress: number) => listener(progress)
        ipcRenderer.on(DESKTOP_CHANNELS.updateProgress.name, handler)
        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.updateProgress.name, handler)
      }
    },
    fs: {
      pickFile: call(DESKTOP_CHANNELS.pickFile),
      pickDirectory: call(DESKTOP_CHANNELS.pickDirectory),
      readText: (path) => call(DESKTOP_CHANNELS.fsReadText)({ path }),
      writeText: (path, content) => call(DESKTOP_CHANNELS.fsWriteText)({ path, content }),
      readJson: <T>(path: string) => call(DESKTOP_CHANNELS.fsReadJson)({ path }) as Promise<T>,
      writeJson: (path, value) => call(DESKTOP_CHANNELS.fsWriteJson)({ path, value }),
      list: (path) => call(DESKTOP_CHANNELS.fsList)({ path }) as Promise<readonly FileSystemEntry[]>,
      exists: (path) => call(DESKTOP_CHANNELS.fsExists)({ path }),
      copy: (source, destination) => call(DESKTOP_CHANNELS.fsCopy)({ source, destination }),
      move: (source, destination) => call(DESKTOP_CHANNELS.fsMove)({ source, destination }),
      remove: (path) => call(DESKTOP_CHANNELS.fsRemove)({ path }),
      mime: (path) => call(DESKTOP_CHANNELS.fsMime)({ path }),
      pathForFile: (file) => webUtils.getPathForFile(file)
    },
    recentFiles: {
      add: (path) => call(DESKTOP_CHANNELS.fsRecentAdd)({ path }),
      list: call(DESKTOP_CHANNELS.fsRecentList),
      remove: (path) => call(DESKTOP_CHANNELS.fsRecentRemove)({ path }),
      clear: call(DESKTOP_CHANNELS.fsRecentClear)
    },
    store: {
      get: <T>() => call(DESKTOP_CHANNELS.storeGet)() as Promise<T>,
      set: (value) => call(DESKTOP_CHANNELS.storeSet)(value),
      onChange: (listener) => {
        const handler = (_event: IpcRendererEvent, value: unknown) => listener(value)
        ipcRenderer.on(DESKTOP_CHANNELS.storeChanged.name, handler)
        return () => ipcRenderer.removeListener(DESKTOP_CHANNELS.storeChanged.name, handler)
      }
    },
    preferences: {
      get: <T>(key: string) => call(DESKTOP_CHANNELS.preferencesGet)({ key }) as Promise<T>,
      set: (key, value) => call(DESKTOP_CHANNELS.preferencesSet)({ key, value }),
      all: <T>() => call(DESKTOP_CHANNELS.preferencesAll)() as Promise<T>
    }
  }

  contextBridge.exposeInMainWorld('desktop', desktop)
}
