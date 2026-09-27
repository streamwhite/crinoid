export interface LoginItemSettings {
  readonly openAtLogin: boolean
  readonly openAsHidden?: boolean
  readonly wasOpenedAtLogin?: boolean
}

export interface LoginItemPort {
  getLoginItemSettings(): LoginItemSettings
  setLoginItemSettings(settings: { openAtLogin: boolean; openAsHidden?: boolean; args?: string[] }): void
}

export interface AutoLaunchOptions {
  readonly openAsHidden?: boolean
  readonly args?: readonly string[]
}

export interface AutoLaunch {
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
  enable(): void
  disable(): void
  toggle(): boolean
}

export function createAutoLaunch(port: LoginItemPort, options: AutoLaunchOptions = {}): AutoLaunch {
  const apply = (openAtLogin: boolean): void => {
    port.setLoginItemSettings({
      openAtLogin,
      ...(options.openAsHidden === undefined ? {} : { openAsHidden: options.openAsHidden }),
      ...(options.args === undefined ? {} : { args: [...options.args] })
    })
  }

  return {
    isEnabled: () => port.getLoginItemSettings().openAtLogin,
    setEnabled: apply,
    enable: () => apply(true),
    disable: () => apply(false),
    toggle: () => {
      const next = !port.getLoginItemSettings().openAtLogin
      apply(next)
      return next
    }
  }
}
