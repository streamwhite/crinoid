export type ProxyMode = 'system' | 'direct' | 'fixed' | 'pac'

export interface ProxyConfigInput {
  readonly mode: ProxyMode
  readonly url?: string
  readonly pacScript?: string
  readonly bypass?: readonly string[]
}

export interface ResolvedProxyConfig {
  readonly mode: ProxyMode
  readonly proxyRules?: string
  readonly pacScript?: string
  readonly proxyBypassRules?: string
}

export interface ProxySession {
  setProxy(config: { proxyRules?: string; pacScript?: string; proxyBypassRules?: string }): Promise<void>
}

export function resolveProxyConfig(input: ProxyConfigInput): ResolvedProxyConfig {
  const bypass = input.bypass && input.bypass.length > 0 ? { proxyBypassRules: input.bypass.join(',') } : {}
  if (input.mode === 'fixed') {
    if (!input.url || !isValidProxyUrl(input.url)) throw new Error(`Invalid proxy URL: ${input.url ?? ''}`)
    return { mode: 'fixed', proxyRules: input.url, ...bypass }
  }
  if (input.mode === 'pac') {
    if (!input.pacScript) throw new Error('PAC script is required for pac mode')
    return { mode: 'pac', pacScript: input.pacScript, ...bypass }
  }
  return { mode: input.mode, ...bypass }
}

export async function applyProxy(session: ProxySession, input: ProxyConfigInput): Promise<ResolvedProxyConfig> {
  const resolved = resolveProxyConfig(input)
  if (resolved.mode === 'fixed') await session.setProxy({ proxyRules: resolved.proxyRules ?? '', ...omitMode(resolved) })
  else if (resolved.mode === 'pac') await session.setProxy({ pacScript: resolved.pacScript ?? '', ...omitMode(resolved) })
  return resolved
}

function omitMode(config: ResolvedProxyConfig): { proxyBypassRules?: string } {
  return config.proxyBypassRules ? { proxyBypassRules: config.proxyBypassRules } : {}
}

function isValidProxyUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
