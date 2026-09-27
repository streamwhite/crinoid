import { compareVersions, isNewerVersion, isPrerelease } from './version.js'
import type { ReleaseChannel } from './release-channel.js'

export interface UpdateInfo {
  readonly version: string
  readonly releaseNotes?: string
}

export interface UpdateCheckResult {
  readonly available: boolean
  readonly version: string | null
  readonly releaseNotes?: string | undefined
}

export interface UpdateAdapter {
  checkForUpdates(): Promise<UpdateInfo | null>
  downloadUpdate(): Promise<void>
  quitAndInstall(): void
  install?(version: string): void
  subscribeProgress?(listener: (progress: number) => void): void
}

export interface UpdateServiceOptions {
  readonly adapter: UpdateAdapter
  readonly currentVersion: string
  readonly channel?: ReleaseChannel | undefined
  readonly onRollback?: ((version: string) => void) | undefined
}

export interface UpdateService {
  check(): Promise<UpdateCheckResult>
  download(onProgress?: (progress: number) => void): Promise<void>
  install(version: string): void
  rollback(): void
}

export function createUpdateService(options: UpdateServiceOptions): UpdateService {
  let lastKnownVersion: string | null = null

  return {
    check: async () => {
      const info = await options.adapter.checkForUpdates()
      if (!info) return { available: false, version: null }
      const allowed = options.channel?.allowPrerelease ?? false
      const available =
        isNewerVersion(info.version, options.currentVersion) && (allowed || !isPrerelease(info.version))
      if (available) lastKnownVersion = info.version
      return {
        available,
        version: info.version,
        ...(info.releaseNotes === undefined ? {} : { releaseNotes: info.releaseNotes })
      }
    },
    download: async (onProgress) => {
      if (onProgress) options.adapter.subscribeProgress?.(onProgress)
      await options.adapter.downloadUpdate()
    },
    install: (version) => {
      if (options.adapter.install) options.adapter.install(version)
      else options.adapter.quitAndInstall()
    },
    rollback: () => {
      options.adapter.install?.(options.currentVersion)
      options.onRollback?.(options.currentVersion)
    }
  }
}
