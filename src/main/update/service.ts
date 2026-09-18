export interface UpdateService { check(): Promise<void>; download(): Promise<void>; install(): void }

export function createUpdateService(adapter: { checkForUpdates(): Promise<void>; downloadUpdate(): Promise<void>; quitAndInstall(): void }): UpdateService {
  return { check: () => adapter.checkForUpdates(), download: () => adapter.downloadUpdate(), install: () => adapter.quitAndInstall() }
}
