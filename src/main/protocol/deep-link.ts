const PROTOCOL = 'myapp:'

export interface DeepLink { route: string; id: string | null }

export function parseDeepLink(value: string): DeepLink | null {
  try { const url = new URL(value); if (url.protocol !== PROTOCOL) return null; const segments = [url.hostname, ...url.pathname.split('/').filter(Boolean)].filter(Boolean); return { route: segments[0] ?? 'home', id: segments[1] ?? null } } catch { return null }
}
