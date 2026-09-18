const ALLOWED_PROTOCOLS = new Set(['https:', 'mailto:'])

export function isAllowedExternalUrl(value: string): boolean {
  try { return ALLOWED_PROTOCOLS.has(new URL(value).protocol) } catch { return false }
}
