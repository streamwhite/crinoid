import { describe, expect, it, vi } from 'vitest'
import { buildContentSecurityPolicy, installContentSecurityPolicy } from 'crinoid/security'
import { createIpcRegistry } from 'crinoid/ipc'
import { isTrustedSender, isPermissionAllowed } from 'crinoid/security'

describe('content security policy', () => {
  it('builds a restrictive default policy', () => {
    const policy = buildContentSecurityPolicy()

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).not.toContain('unsafe-eval')
  })

  it('allows extra sources when configured', () => {
    const policy = buildContentSecurityPolicy({ apiOrigins: ['https://api.example.com'] })
    expect(policy).toContain('https://api.example.com')
  })

  it('installs a response header on the session', () => {
    const onHeadersReceived = vi.fn()
    const session = { webRequest: { onHeadersReceived } }

    installContentSecurityPolicy(session, { apiOrigins: [] })

    expect(onHeadersReceived).toHaveBeenCalledWith(expect.any(Function))
    const listener = onHeadersReceived.mock.calls[0]?.[0] as (details: unknown, callback: (response: unknown) => void) => void
    const callback = vi.fn()
    listener({ responseHeaders: {} }, callback)
    expect(callback).toHaveBeenCalledWith({ responseHeaders: expect.objectContaining({ 'Content-Security-Policy': [expect.any(String)] }) })
  })
})

describe('ipc sender trust', () => {
  it('trusts the application origin only', () => {
    expect(isTrustedSender({ url: 'file:///app/index.html' }, 'file:')).toBe(true)
    expect(isTrustedSender({ url: 'https://evil.example' }, 'file:')).toBe(false)
  })

  it('allows only approved permissions', () => {
    expect(isPermissionAllowed('notifications')).toBe(true)
    expect(isPermissionAllowed('geolocation')).toBe(false)
  })
})

describe('ipc authorization', () => {
  it('rejects untrusted senders at the registry boundary', async () => {
    const handlers = new Map<string, (event: { sender: { getURL(): string } }, ...args: unknown[]) => unknown>()
    const ipcMain = {
      handle: (channel: string, listener: (event: { sender: { getURL(): string } }, ...args: unknown[]) => unknown) => handlers.set(channel, listener),
      removeHandler: (channel: string) => handlers.delete(channel)
    }
    const registry = createIpcRegistry(ipcMain, { origin: 'file:' })
    registry.register<{ id: string }, string>({
      channel: { name: 'secure.op', validate: (value): value is { id: string } => typeof (value as { id?: unknown })?.id === 'string', respond: (value) => value },
      handle: () => 'ok'
    })

    await expect(handlers.get('secure.op')!({ sender: { getURL: () => 'https://evil.example' } }, { id: '1' })).rejects.toThrow('Untrusted')
  })
})
