export interface CpuCore {
  readonly model: string
}

export interface SystemPort {
  platform(): string
  arch(): string
  release(): string
  hostname(): string
  cpus(): readonly CpuCore[]
  totalMemory(): number
  freeMemory(): number
  uptime(): number
  appVersion(): string
  executableName(): string
  locale(): string
  isPackaged(): boolean
}

export interface SystemInfo {
  readonly os: {
    readonly platform: string
    readonly arch: string
    readonly release: string
    readonly hostname: string
  }
  readonly cpu: {
    readonly model: string
    readonly cores: number
  }
  readonly memory: {
    readonly totalBytes: number
    readonly freeBytes: number
    readonly usedBytes: number
  }
  readonly app: {
    readonly version: string
    readonly executableName: string
    readonly locale: string
    readonly isPackaged: boolean
    readonly uptimeSeconds: number
  }
}

const UNKNOWN_MODEL = 'unknown'

export function collectSystemInfo(port: SystemPort): SystemInfo {
  const cpus = port.cpus()
  const totalBytes = port.totalMemory()
  const freeBytes = port.freeMemory()
  return {
    os: {
      platform: port.platform(),
      arch: port.arch(),
      release: port.release(),
      hostname: port.hostname()
    },
    cpu: {
      model: cpus[0]?.model ?? UNKNOWN_MODEL,
      cores: cpus.length
    },
    memory: {
      totalBytes,
      freeBytes,
      usedBytes: totalBytes - freeBytes
    },
    app: {
      version: port.appVersion(),
      executableName: port.executableName(),
      locale: port.locale(),
      isPackaged: port.isPackaged(),
      uptimeSeconds: port.uptime()
    }
  }
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const
const KILO = 1024

export function formatBytes(bytes: number): string {
  const exponent = bytes <= 0 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(KILO)), BYTE_UNITS.length - 1)
  const value = bytes / KILO ** exponent
  const rounded = exponent === 0 ? value : Math.round(value * 10) / 10
  return `${rounded} ${BYTE_UNITS[exponent]}`
}
