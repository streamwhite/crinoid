export interface DockPort {
  setBadge(text: string): void
  bounce(type: 'critical' | 'informational'): number
  cancelBounce(id: number): void
}

export interface TaskbarProgressOptions {
  readonly mode: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused'
}

export interface TaskbarPort {
  setProgressBar(progress: number, options?: TaskbarProgressOptions): void
  flashFrame(flag: boolean): void
}

export interface BadgeAppPort {
  setBadgeCount?: (count: number) => unknown
  dock?: DockPort | undefined
}

export interface PlatformIntegrationOptions {
  readonly app: BadgeAppPort
  readonly taskbar: TaskbarPort
  readonly isMacOS?: boolean | undefined
}

export interface PlatformIntegration {
  setBadge(count: number): void
  requestAttention(critical?: boolean): void
  setProgress(progress: number): void
  flash(flag: boolean): void
}

export function createPlatformIntegration(options: PlatformIntegrationOptions): PlatformIntegration {
  const isMacOS = options.isMacOS ?? process.platform === 'darwin'

  return {
    setBadge: (count) => {
      if (options.app.setBadgeCount) {
        options.app.setBadgeCount(count)
        return
      }
      options.app.dock?.setBadge(String(count))
    },
    requestAttention: (critical = false) => {
      if (isMacOS && options.app.dock) {
        options.app.dock.bounce(critical ? 'critical' : 'informational')
        return
      }
      options.taskbar.flashFrame(true)
    },
    setProgress: (progress) => options.taskbar.setProgressBar(progress),
    flash: (flag) => options.taskbar.flashFrame(flag)
  }
}
