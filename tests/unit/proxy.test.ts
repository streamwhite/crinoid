import { describe, expect, it, vi } from 'vitest'
import { applyProxy, resolveProxyConfig } from 'crinoid/proxy'

describe('proxy configuration', () => {
  it('resolves from an explicit mode', () => {
    expect(resolveProxyConfig({ mode: 'system' })).toEqual({ mode: 'system' })
    expect(resolveProxyConfig({ mode: 'direct' })).toEqual({ mode: 'direct' })
  })

  it('resolves fixed servers from a URL', () => {
    expect(resolveProxyConfig({ mode: 'fixed', url: 'http://proxy:8080' })).toEqual({
      mode: 'fixed',
      proxyRules: 'http://proxy:8080'
    })
  })

  it('rejects an invalid proxy URL', () => {
    expect(() => resolveProxyConfig({ mode: 'fixed', url: 'not a url' })).toThrow('Invalid proxy')
  })

  it('resolves pac scripts', () => {
    expect(resolveProxyConfig({ mode: 'pac', pacScript: 'https://example.com/proxy.pac' })).toEqual({
      mode: 'pac',
      pacScript: 'https://example.com/proxy.pac'
    })
  })

  it('applies resolved config to a session', async () => {
    const setProxy = vi.fn(async () => {})
    const session = { setProxy }

    await applyProxy(session, { mode: 'fixed', url: 'http://proxy:8080' })

    expect(setProxy).toHaveBeenCalledWith({ proxyRules: 'http://proxy:8080' })
  })
})
