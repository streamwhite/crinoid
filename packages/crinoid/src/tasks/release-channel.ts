export interface ReleaseChannel {
  readonly name: string
  readonly allowPrerelease: boolean
}

export const DEFAULT_CHANNELS: readonly ReleaseChannel[] = [
  { name: 'stable', allowPrerelease: false },
  { name: 'beta', allowPrerelease: true }
]

const FALLBACK_CHANNEL: ReleaseChannel = { name: 'stable', allowPrerelease: false }

export function resolveChannel(name: string, channels: readonly ReleaseChannel[] = DEFAULT_CHANNELS): ReleaseChannel {
  return channels.find((channel) => channel.name === name) ?? FALLBACK_CHANNEL
}
