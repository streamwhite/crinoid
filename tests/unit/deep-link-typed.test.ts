import { describe, expect, it } from 'vitest'
import { parseDeepLink, parseDeepLinkPath } from 'crinoid/deep-link'

describe('deep link parsing', () => {
  it('parses route and id from a custom protocol URL', () => {
    expect(parseDeepLink('myapp://projects/42', 'myapp')).toEqual({ route: 'projects', id: '42' })
  })

  it('defaults the route when the path is empty', () => {
    expect(parseDeepLink('myapp://', 'myapp')).toEqual({ route: 'home', id: null })
  })

  it('rejects other protocols', () => {
    expect(parseDeepLink('https://example.com', 'myapp')).toBeNull()
  })

  it('exposes query parameters for auth callbacks', () => {
    expect(parseDeepLinkPath('myapp://auth/callback?code=abc&state=xyz')).toEqual({
      segments: ['auth', 'callback'],
      params: { code: 'abc', state: 'xyz' }
    })
  })
})
