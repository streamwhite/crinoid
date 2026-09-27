import { describe, expect, it, vi } from 'vitest'
import { collectSystemInfo, formatBytes } from 'crinoid/system'

function createPort() {
  return {
    platform: vi.fn(() => 'linux'),
    arch: vi.fn(() => 'x64'),
    release: vi.fn(() => '6.1.0'),
    hostname: vi.fn(() => 'dev-machine'),
    cpus: vi.fn(() => [{ model: 'CPU' }, { model: 'CPU' }]),
    totalMemory: vi.fn(() => 16 * 1024 ** 3),
    freeMemory: vi.fn(() => 4 * 1024 ** 3),
    uptime: vi.fn(() => 3600),
    appVersion: vi.fn(() => '1.2.3'),
    executableName: vi.fn(() => 'my-app'),
    locale: vi.fn(() => 'en-US'),
    isPackaged: vi.fn(() => true)
  }
}

describe('system information', () => {
  it('collects OS, CPU, and memory facts', () => {
    const info = collectSystemInfo(createPort())

    expect(info.os).toMatchObject({ platform: 'linux', arch: 'x64', release: '6.1.0', hostname: 'dev-machine' })
    expect(info.cpu.cores).toBe(2)
    expect(info.memory.totalBytes).toBe(16 * 1024 ** 3)
    expect(info.memory.freeBytes).toBe(4 * 1024 ** 3)
    expect(info.app).toMatchObject({ version: '1.2.3', isPackaged: true, locale: 'en-US' })
  })

  it('formats byte counts', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })
})
