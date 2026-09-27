export interface FakeIpcEvent {
  readonly sender: { getURL(): string }
}

export type FakeIpcHandler = (event: FakeIpcEvent, ...args: unknown[]) => unknown
export type FakeIpcListener = (...args: unknown[]) => void

export const TRUSTED_RENDERER_URL = 'file:///app/index.html'
export const UNTRUSTED_RENDERER_URL = 'https://evil.example/index.html'

export function createIpcEvent(url: string = TRUSTED_RENDERER_URL): FakeIpcEvent {
  return { sender: { getURL: () => url } }
}

export interface FakeIpcMain {
  readonly handlers: Map<string, FakeIpcHandler>
  handle(channel: string, listener: FakeIpcHandler): void
  removeHandler(channel: string): void
  on(channel: string, listener: FakeIpcListener): void
  removeListener(channel: string, listener: FakeIpcListener): void
  emit(channel: string, ...args: unknown[]): void
  invoke(channel: string, event: FakeIpcEvent, ...args: unknown[]): Promise<unknown>
}

export function createFakeIpcMain(): FakeIpcMain {
  const handlers = new Map<string, FakeIpcHandler>()
  const listeners = new Map<string, Set<FakeIpcListener>>()

  return {
    handlers,
    handle: (channel, listener) => {
      handlers.set(channel, listener)
    },
    removeHandler: (channel) => {
      handlers.delete(channel)
    },
    on: (channel, listener) => {
      const set = listeners.get(channel) ?? new Set<FakeIpcListener>()
      set.add(listener)
      listeners.set(channel, set)
    },
    removeListener: (channel, listener) => {
      listeners.get(channel)?.delete(listener)
    },
    emit: (channel, ...args) => {
      for (const listener of [...(listeners.get(channel) ?? [])]) listener(...args)
    },
    invoke: async (channel, event, ...args) => {
      const handler = handlers.get(channel)
      if (!handler) throw new Error(`No fake IPC handler registered for ${channel}`)
      return handler(event, ...args)
    }
  }
}

export interface FakeIpcRenderer {
  readonly calls: Array<{ channel: string; args: unknown[] }>
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
  send(channel: string, ...args: unknown[]): void
}

export interface FakeIpcPair {
  readonly ipcMain: FakeIpcMain
  readonly ipcRenderer: FakeIpcRenderer
}

export interface FakeIpcPairOptions {
  readonly url?: string
}

export function createFakeIpcPair(options: FakeIpcPairOptions = {}): FakeIpcPair {
  const ipcMain = createFakeIpcMain()
  const url = options.url ?? TRUSTED_RENDERER_URL
  const calls: Array<{ channel: string; args: unknown[] }> = []

  const ipcRenderer: FakeIpcRenderer = {
    calls,
    invoke: (channel, ...args) => {
      calls.push({ channel, args })
      return ipcMain.invoke(channel, createIpcEvent(url), ...args)
    },
    send: (channel, ...args) => {
      calls.push({ channel, args })
      ipcMain.emit(channel, createIpcEvent(url), ...args)
    }
  }

  return { ipcMain, ipcRenderer }
}
