import type { TokenSet } from './token.js'

export interface PkcePair {
  readonly verifier: string
  readonly challenge: string
}

export interface OAuthExchangeParams {
  readonly code: string
  readonly codeVerifier: string
  readonly redirectUri: string
}

export interface OAuthClientOptions {
  readonly clientId: string
  readonly authorizeUrl: string
  readonly tokenUrl: string
  readonly redirectUri: string
  readonly scopes?: readonly string[]
  readonly exchange: (params: OAuthExchangeParams) => Promise<TokenSet | null>
}

export interface AuthorizationRequest {
  readonly url: string
  readonly state: string
  readonly verifier: string
}

export interface OAuthCallback {
  readonly code?: string
  readonly state?: string
  readonly error?: string
}

export interface OAuthClient {
  createAuthorizationRequest(): Promise<AuthorizationRequest>
  completeAuthorization(callbackUrl: string, verifier: string): Promise<TokenSet | null>
}

const VERIFIER_BYTES = 32
const CHALLENGE_METHOD = 'S256'

export async function createPkcePair(): Promise<PkcePair> {
  const random = new Uint8Array(VERIFIER_BYTES)
  crypto.getRandomValues(random)
  const verifier = base64Url(random)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64Url(new Uint8Array(digest)) }
}

export function parseOAuthCallback(value: string): OAuthCallback | null {
  try {
    const url = new URL(value)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')
    if (!code && !error) return null
    return {
      ...(code === null ? {} : { code }),
      ...(state === null ? {} : { state }),
      ...(error === null ? {} : { error })
    }
  } catch {
    return null
  }
}

export function createOAuthClient(options: OAuthClientOptions): OAuthClient {
  let issuedState: string | null = null

  return {
    createAuthorizationRequest: async () => {
      const { verifier, challenge } = await createPkcePair()
      const state = base64Url(randomBytes(16))
      issuedState = state
      const url = new URL(options.authorizeUrl)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('client_id', options.clientId)
      url.searchParams.set('redirect_uri', options.redirectUri)
      url.searchParams.set('state', state)
      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', CHALLENGE_METHOD)
      if (options.scopes?.length) url.searchParams.set('scope', options.scopes.join(' '))
      return { url: url.toString(), state, verifier }
    },
    completeAuthorization: async (callbackUrl, verifier) => {
      const callback = parseOAuthCallback(callbackUrl)
      if (!callback) throw new Error('Not an OAuth callback URL')
      if (callback.error) throw new Error(`OAuth error: ${callback.error}`)
      if (!callback.code) throw new Error('OAuth callback is missing a code')
      if (!callback.state || !issuedState || callback.state !== issuedState) throw new Error('OAuth state mismatch')
      issuedState = null
      return options.exchange({
        code: callback.code,
        codeVerifier: verifier,
        redirectUri: options.redirectUri
      })
    }
  }
}

function randomBytes(length: number): Uint8Array {
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  return values
}

function base64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
