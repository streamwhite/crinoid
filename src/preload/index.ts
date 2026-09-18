import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, type DesktopAPI } from '@/shared/ipc/types'

const desktop: DesktopAPI = {
  app: { getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.getVersion), onDeepLink: (listener) => { const handler = (_event: Electron.IpcRendererEvent, route: string, id: string | null) => listener(route, id); ipcRenderer.on(IPC_CHANNELS.deepLink, handler); return () => ipcRenderer.removeListener(IPC_CHANNELS.deepLink, handler) } },
  window: { minimize: () => ipcRenderer.send(IPC_CHANNELS.minimize), maximize: () => ipcRenderer.send(IPC_CHANNELS.maximize), close: () => ipcRenderer.send(IPC_CHANNELS.close) },
  shell: { openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.openExternal, url) },
  dialog: { openFile: () => ipcRenderer.invoke(IPC_CHANNELS.openFile) },
  clipboard: { readText: () => ipcRenderer.invoke(IPC_CHANNELS.readClipboard), writeText: (value) => ipcRenderer.invoke(IPC_CHANNELS.writeClipboard, value) }
}

contextBridge.exposeInMainWorld('desktop', desktop)
