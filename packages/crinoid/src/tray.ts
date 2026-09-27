export interface TrayPort {
  setToolTip(tooltip: string): void
  setContextMenu(menu: unknown): void
  on(event: string, listener: (...args: unknown[]) => void): unknown
  destroy(): void
}

export interface TrayMenuBuilder {
  buildFromTemplate(template: Record<string, unknown>[]): unknown
}

export interface TrayWindow {
  show(): void
  focus(): void
  hide(): void
  restore?(): void
  on(event: string, listener: (...args: unknown[]) => void): unknown
}

export interface TrayLabels {
  readonly show: string
  readonly quit: string
}

export interface TrayControllerOptions {
  readonly tray: TrayPort
  readonly window: TrayWindow
  readonly menu: TrayMenuBuilder
  readonly labels: TrayLabels
  readonly tooltip: string
  readonly onQuit: () => void
  readonly minimizeToTray?: boolean
  readonly closeToTray?: boolean
  readonly shouldQuit?: (() => boolean) | undefined
}

export interface TrayController {
  show(): void
  dispose(): void
}

export function createTrayController(options: TrayControllerOptions): TrayController {
  const { tray, window, menu, labels } = options

  const show = (): void => {
    window.show()
    window.restore?.()
    window.focus()
  }

  tray.setToolTip(options.tooltip)
  tray.setContextMenu(
    menu.buildFromTemplate([
      { label: labels.show, click: show },
      { type: 'separator' },
      { label: labels.quit, click: options.onQuit }
    ])
  )
  tray.on('click', show)

  if (options.minimizeToTray) {
    window.on('minimize', (event) => {
      preventDefault(event)
      window.hide()
    })
  }

  if (options.closeToTray) {
    window.on('close', (event) => {
      if (options.shouldQuit?.()) return
      preventDefault(event)
      window.hide()
    })
  }

  return {
    show,
    dispose: () => tray.destroy()
  }
}

function preventDefault(event: unknown): void {
  const candidate = event as { preventDefault?: () => void } | undefined
  if (typeof candidate?.preventDefault === 'function') candidate.preventDefault()
}
