export interface DeepLink {
  readonly route: string
  readonly id: string | null
}

export interface DeepLinkPath {
  readonly segments: readonly string[]
  readonly params: Readonly<Record<string, string>>
}

export function parseDeepLink(value: string, protocol: string): DeepLink | null {
  try {
    const url = new URL(value)
    if (url.protocol !== `${protocol}:`) return null
    const segments = [url.hostname, ...url.pathname.split('/').filter(Boolean)].filter(Boolean)
    return { route: segments[0] ?? 'home', id: segments[1] ?? null }
  } catch {
    return null
  }
}

export function parseDeepLinkPath(value: string): DeepLinkPath | null {
  try {
    const url = new URL(value)
    const segments = [url.hostname, ...url.pathname.split('/').filter(Boolean)].filter(Boolean)
    const params: Record<string, string> = {}
    for (const [key, param] of url.searchParams) params[key] = param
    return { segments, params }
  } catch {
    return null
  }
}

export function isDeepLink(value: string, protocol: string): boolean {
  try {
    return new URL(value).protocol === `${protocol}:`
  } catch {
    return false
  }
}

export function findDeepLinkArgument(commandLine: readonly string[], protocol: string): string | undefined {
  return commandLine.find((argument) => argument.startsWith(`${protocol}:`))
}

export interface DeepLinkRouter {
  register(route: string, handler: (link: DeepLink) => void): () => void
  handle(url: string): boolean
  routes(): readonly string[]
}

export function createDeepLinkRouter(protocol: string, fallback?: (link: DeepLink) => void): DeepLinkRouter {
  const handlers = new Map<string, (link: DeepLink) => void>()

  return {
    register: (route, handler) => {
      handlers.set(route, handler)
      return () => handlers.delete(route)
    },
    handle: (url) => {
      const link = parseDeepLink(url, protocol)
      if (!link) return false
      const handler = handlers.get(link.route)
      if (handler) {
        handler(link)
        return true
      }
      if (fallback) {
        fallback(link)
        return true
      }
      return false
    },
    routes: () => [...handlers.keys()]
  }
}
