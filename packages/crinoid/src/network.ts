export interface NetworkStatusPort {
  isOnline(): boolean
}

export interface NetworkStatus {
  readonly online: boolean
  readonly type: 'unknown'
}

export async function readNetworkStatus(port: NetworkStatusPort): Promise<NetworkStatus> {
  return { online: port.isOnline(), type: 'unknown' }
}

export interface NetworkEventSubscription {
  addEventListener(event: string, listener: (online: boolean) => void): void
  removeEventListener(event: string, listener: (online: boolean) => void): void
}

export interface NetworkMonitorOptions {
  readonly onChange: (online: boolean) => void
  readonly isOnline: () => boolean
}

export interface NetworkMonitor {
  dispose(): void
}

export interface BrowserNetworkGlobal {
  online: boolean
  addEventListener(event: 'online' | 'offline', listener: () => void): void
  removeEventListener(event: 'online' | 'offline', listener: () => void): void
}

export function createBrowserNetworkMonitor(
  global: BrowserNetworkGlobal,
  onChange: (online: boolean) => void
): NetworkMonitor {
  const onOnline = (): void => onChange(true)
  const onOffline = (): void => onChange(false)
  global.addEventListener('online', onOnline)
  global.addEventListener('offline', onOffline)
  return {
    dispose: () => {
      global.removeEventListener('online', onOnline)
      global.removeEventListener('offline', onOffline)
    }
  }
}

export function isBrowserOnline(global: BrowserNetworkGlobal): boolean {
  return global.online
}

const CHANGE_EVENT = 'network:change'

export function createNetworkMonitor(subscription: NetworkEventSubscription, options: NetworkMonitorOptions): NetworkMonitor {
  const listener = (online: boolean): void => {
    if (online !== options.isOnline()) options.onChange(online)
  }
  subscription.addEventListener(CHANGE_EVENT, listener)
  return {
    dispose: () => subscription.removeEventListener(CHANGE_EVENT, listener)
  }
}
