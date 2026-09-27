export interface TokenSet {
  readonly accessToken: string
  readonly refreshToken: string
  readonly expiresAt: number
}

export interface TokenProvider {
  refresh(refreshToken: string): Promise<TokenSet | null>
}

export interface TokenManagerOptions {
  readonly provider?: TokenProvider | undefined
  readonly now?: (() => number) | undefined
  readonly refreshSkewMs?: number | undefined
}

export type TokenListener = (tokens: TokenSet | null) => void

export interface TokenManager {
  get(): TokenSet | null
  set(tokens: TokenSet): void
  clear(): void
  ensureValid(): Promise<TokenSet | null>
  subscribe(listener: TokenListener): () => void
}

const DEFAULT_SKEW_MS = 30_000

export function isTokenExpired(tokens: TokenSet, now: number, skewMs = DEFAULT_SKEW_MS): boolean {
  return tokens.expiresAt - skewMs <= now
}

export function createTokenManager(options: TokenManagerOptions = {}): TokenManager {
  const now = options.now ?? (() => Date.now())
  const skewMs = options.refreshSkewMs ?? DEFAULT_SKEW_MS
  const listeners = new Set<TokenListener>()
  let tokens: TokenSet | null = null

  const commit = (next: TokenSet | null): void => {
    tokens = next
    for (const listener of [...listeners]) listener(next)
  }

  return {
    get: () => tokens,
    set: commit,
    clear: () => commit(null),
    ensureValid: async () => {
      if (!tokens) return null
      if (!isTokenExpired(tokens, now(), skewMs)) return tokens
      if (!options.provider) return tokens
      const refreshed = await options.provider.refresh(tokens.refreshToken)
      if (!refreshed) {
        commit(null)
        return null
      }
      commit(refreshed)
      return refreshed
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
