import { describe, expect, it, vi } from 'vitest'
import { createOAuthClient, createPkcePair, parseOAuthCallback } from 'crinoid/auth'

describe('pkce', () => {
  it('creates a verifier and derived challenge', async () => {
    const pair = await createPkcePair()

    expect(pair.verifier.length).toBeGreaterThanOrEqual(43)
    expect(pair.challenge).not.toBe(pair.verifier)
    expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('oauth callback parsing', () => {
  it('extracts code and state', () => {
    expect(parseOAuthCallback('myapp://auth/callback?code=abc&state=xyz')).toEqual({ code: 'abc', state: 'xyz' })
  })

  it('extracts errors', () => {
    expect(parseOAuthCallback('myapp://auth/callback?error=access_denied')).toEqual({ error: 'access_denied' })
  })

  it('returns null for unrelated URLs', () => {
    expect(parseOAuthCallback('https://example.com')).toBeNull()
  })
})

describe('oauth client', () => {
  it('builds an authorize URL with PKCE parameters', async () => {
    const client = createOAuthClient({
      clientId: 'client',
      authorizeUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      redirectUri: 'myapp://auth/callback',
      exchange: vi.fn()
    })

    const request = await client.createAuthorizationRequest()

    expect(request.url).toContain('code_challenge=')
    expect(request.url).toContain('code_challenge_method=S256')
    expect(request.url).toContain('state=')
    expect(request.verifier).toBeTruthy()
  })

  it('exchanges a callback code for tokens', async () => {
    const exchange = vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r', expiresAt: 9_999 }))
    const client = createOAuthClient({
      clientId: 'client',
      authorizeUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      redirectUri: 'myapp://auth/callback',
      exchange
    })

    const request = await client.createAuthorizationRequest()
    const tokens = await client.completeAuthorization('myapp://auth/callback?code=abc&state=' + request.state, request.verifier)

    expect(exchange).toHaveBeenCalledWith(expect.objectContaining({ code: 'abc', codeVerifier: request.verifier }))
    expect(tokens?.accessToken).toBe('a')
  })

  it('rejects a mismatched state', async () => {
    const client = createOAuthClient({
      clientId: 'client',
      authorizeUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      redirectUri: 'myapp://auth/callback',
      exchange: vi.fn()
    })

    const request = await client.createAuthorizationRequest()
    await expect(client.completeAuthorization('myapp://auth/callback?code=abc&state=wrong', request.verifier)).rejects.toThrow('state')
  })
})
