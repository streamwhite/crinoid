import { describe, expect, it, vi } from 'vitest'
import { createTokenManager, isTokenExpired } from 'crinoid/auth'

const base = { accessToken: 'a', refreshToken: 'r', expiresAt: 1_000 }

describe('token helpers', () => {
  it('detects expiry with a safety skew', () => {
    expect(isTokenExpired(base, 0, 0)).toBe(false)
    expect(isTokenExpired(base, 900, 0)).toBe(false)
    expect(isTokenExpired(base, 1_000, 0)).toBe(true)
    expect(isTokenExpired(base, 900, 200)).toBe(true)
  })
})

describe('token manager', () => {
  it('stores and returns the current token set', () => {
    const manager = createTokenManager()
    manager.set(base)

    expect(manager.get()).toEqual(base)
  })

  it('clears tokens', () => {
    const manager = createTokenManager()
    manager.set(base)
    manager.clear()

    expect(manager.get()).toBeNull()
  })

  it('refreshes an expiring token through the provider', async () => {
    const provider = {
      refresh: vi.fn(async () => ({ ...base, accessToken: 'fresh', expiresAt: 9_999 }))
    }
    const manager = createTokenManager({ provider, now: () => 1_000, refreshSkewMs: 5_000 })

    manager.set(base)
    const token = await manager.ensureValid()

    expect(provider.refresh).toHaveBeenCalledWith('r')
    expect(token?.accessToken).toBe('fresh')
  })

  it('keeps a non-expiring token without refreshing', async () => {
    const provider = { refresh: vi.fn() }
    const manager = createTokenManager({ provider, now: () => 0, refreshSkewMs: 0 })

    manager.set({ ...base, expiresAt: 10_000 })
    const token = await manager.ensureValid()

    expect(provider.refresh).not.toHaveBeenCalled()
    expect(token?.accessToken).toBe('a')
  })

  it('clears tokens when refresh fails', async () => {
    const provider = { refresh: vi.fn(async () => null) }
    const manager = createTokenManager({ provider, now: () => 1_000, refreshSkewMs: 5_000 })
    manager.set(base)

    await manager.ensureValid()

    expect(manager.get()).toBeNull()
  })

  it('notifies subscribers on token changes', () => {
    const manager = createTokenManager()
    const listener = vi.fn()
    manager.subscribe(listener)

    manager.set(base)
    manager.clear()

    expect(listener).toHaveBeenNthCalledWith(1, base)
    expect(listener).toHaveBeenNthCalledWith(2, null)
  })
})
