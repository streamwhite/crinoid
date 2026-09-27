export interface PowerStatusPort {
  getPowerSaveBlockerState(): Promise<string>
  getBatteryLevel(): Promise<number>
}

export interface BatteryStatus {
  readonly charging: boolean
  readonly level: number
}

const CHARGING_STATES = new Set(['charging', 'charged'])

export async function readBatteryStatus(port: PowerStatusPort): Promise<BatteryStatus> {
  const [state, level] = await Promise.all([port.getPowerSaveBlockerState(), port.getBatteryLevel()])
  return { charging: CHARGING_STATES.has(state), level }
}

export interface PowerEventSource {
  on(event: 'suspend' | 'resume' | 'lock-screen' | 'unlock-screen', listener: () => void): unknown
  off?(event: 'suspend' | 'resume' | 'lock-screen' | 'unlock-screen', listener: () => void): unknown
}

export interface PowerHandlers {
  readonly onSuspend?: (() => void) | undefined
  readonly onResume?: (() => void) | undefined
  readonly onLock?: (() => void) | undefined
  readonly onUnlock?: (() => void) | undefined
}

export interface PowerMonitor {
  dispose(): void
}

export function createPowerMonitor(source: PowerEventSource, handlers: PowerHandlers): PowerMonitor {
  const bindings: Array<['suspend' | 'resume' | 'lock-screen' | 'unlock-screen', () => void]> = []
  const bind = (event: 'suspend' | 'resume' | 'lock-screen' | 'unlock-screen', handler: (() => void) | undefined): void => {
    if (!handler) return
    source.on(event, handler)
    bindings.push([event, handler])
  }

  bind('suspend', handlers.onSuspend)
  bind('resume', handlers.onResume)
  bind('lock-screen', handlers.onLock)
  bind('unlock-screen', handlers.onUnlock)

  return {
    dispose: () => {
      for (const [event, handler] of bindings) source.off?.(event, handler)
      bindings.length = 0
    }
  }
}
