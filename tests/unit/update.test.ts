import { describe, expect, it } from 'vitest'
import { compareVersions, isNewerVersion, isPrerelease, parseVersion } from 'crinoid/tasks'
import { DEFAULT_CHANNELS, resolveChannel } from 'crinoid/tasks'
import { createUpdateService } from 'crinoid/tasks'

describe('version management', () => {
  it('parses semver strings', () => {
    expect(parseVersion('1.2.3')).toEqual({ major: 1, minor: 2, patch: 3, prerelease: null })
    expect(parseVersion('2.0.0-beta.1')).toEqual({ major: 2, minor: 0, patch: 0, prerelease: 'beta.1' })
  })

  it('compares versions including prereleases', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(-1)
    expect(compareVersions('1.2.0', '1.1.9')).toBe(1)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(compareVersions('1.0.0-beta', '1.0.0')).toBe(-1)
  })

  it('detects newer versions', () => {
    expect(isNewerVersion('1.2.0', '1.1.0')).toBe(true)
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false)
  })

  it('detects prereleases and ignores build metadata', () => {
    expect(isPrerelease('1.0.0-beta.2')).toBe(true)
    expect(isPrerelease('1.0.0')).toBe(false)
    expect(parseVersion('1.2.3+build.5')).toMatchObject({ major: 1, minor: 2, patch: 3, prerelease: null })
  })
})

describe('release channels', () => {
  it('exposes stable and beta channels', () => {
    expect(DEFAULT_CHANNELS.map((channel) => channel.name)).toEqual(['stable', 'beta'])
  })

  it('resolves a channel by name with a stable fallback', () => {
    expect(resolveChannel('beta').name).toBe('beta')
    expect(resolveChannel('unknown').name).toBe('stable')
  })

  it('offers prereleases only for beta', () => {
    expect(resolveChannel('stable').allowPrerelease).toBe(false)
    expect(resolveChannel('beta').allowPrerelease).toBe(true)
  })
})

describe('update service', () => {
  function createAdapter() {
    return {
      checkForUpdates: async () => ({ version: '1.1.0', releaseNotes: 'notes' }),
      downloadUpdate: async () => {},
      quitAndInstall: () => {}
    }
  }

  it('checks for updates and reports availability', async () => {
    const service = createUpdateService({ adapter: createAdapter(), currentVersion: '1.0.0' })
    const result = await service.check()

    expect(result.available).toBe(true)
    expect(result.version).toBe('1.1.0')
  })

  it('reports no update when versions match', async () => {
    const service = createUpdateService({ adapter: createAdapter(), currentVersion: '1.1.0' })
    const result = await service.check()

    expect(result.available).toBe(false)
  })

  it('downloads and forwards progress', async () => {
    const service = createUpdateService({
      adapter: {
        ...createAdapter(),
        subscribeProgress: (listener) => {
          listener(0.5)
          listener(1)
        }
      },
      currentVersion: '1.0.0'
    })
    const progress: number[] = []
    await service.download((value) => progress.push(value))

    expect(progress).toEqual([0.5, 1])
  })

  it('installs and can roll back to the previous version', async () => {
    const installed: string[] = []
    const service = createUpdateService({
      adapter: { ...createAdapter(), install: (version: string) => installed.push(version) },
      currentVersion: '1.0.0'
    })

    service.install('1.1.0')
    service.rollback()

    expect(installed).toEqual(['1.1.0', '1.0.0'])
  })
})
