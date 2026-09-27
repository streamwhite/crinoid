export interface SingleInstanceApp {
  requestSingleInstanceLock(): boolean
  on(event: 'second-instance', listener: (event: unknown, commandLine: readonly string[]) => void): unknown
  quit(): void
}

export interface SingleInstanceOptions {
  readonly app: SingleInstanceApp
  readonly focus?: (() => void) | undefined
  readonly onSecondInstance?: ((commandLine: readonly string[]) => void) | undefined
}

export function createSingleInstance(options: SingleInstanceOptions): boolean {
  if (!options.app.requestSingleInstanceLock()) {
    options.app.quit()
    return false
  }
  options.app.on('second-instance', (_event, commandLine) => {
    options.onSecondInstance?.(commandLine)
    options.focus?.()
  })
  return true
}
