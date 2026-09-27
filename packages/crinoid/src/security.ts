const ALLOWED_PROTOCOLS = new Set(['https:', 'mailto:'])
const ALLOWED_PERMISSIONS = new Set(['notifications'])

const DEFAULT_CSP_DIRECTIVES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['default-src', ["'self'"]],
  ['script-src', ["'self'"]],
  ['style-src', ["'self'", "'unsafe-inline'"]],
  ['img-src', ["'self'", 'data:', 'blob:']],
  ['font-src', ["'self'", 'data:']],
  ['object-src', ["'none'"]],
  ['base-uri', ["'self'"]],
  ['form-action', ["'self'"]],
  ['frame-ancestors', ["'none'"]]
]

export interface ContentSecurityPolicyOptions {
  readonly apiOrigins?: readonly string[] | undefined
  readonly devServerUrl?: string | undefined
}

export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions = {}): string {
  const connectSources = ["'self'", ...(options.apiOrigins ?? [])]
  const directives = DEFAULT_CSP_DIRECTIVES.map(([name, values]) =>
    name === 'connect-src' ? `connect-src ${values.join(' ')}` : `${name} ${values.join(' ')}`
  )
  directives.push(`connect-src ${connectSources.join(' ')}`)
  if (options.devServerUrl) {
    const origin = safeOrigin(options.devServerUrl)
    if (origin) directives.push(`ws: ${origin}`)
  }
  return directives.join('; ')
}

export interface HeadersSession {
  webRequest: {
    onHeadersReceived(listener: (details: unknown, callback: (response: { responseHeaders: Record<string, string[]> }) => void) => void): void
  }
}

export function installContentSecurityPolicy(session: HeadersSession, options: ContentSecurityPolicyOptions = {}): void {
  const policy = buildContentSecurityPolicy(options)
  session.webRequest.onHeadersReceived((_details, callback) => {
    callback({ responseHeaders: { 'Content-Security-Policy': [policy] } })
  })
}

export function isAllowedExternalUrl(value: string): boolean {
  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    return false
  }
}

export function isTrustedSender(sender: { url: string }, protocol: string): boolean {
  try {
    return new URL(sender.url).protocol === protocol
  } catch {
    return false
  }
}

export function isPermissionAllowed(permission: string): boolean {
  return ALLOWED_PERMISSIONS.has(permission)
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}
