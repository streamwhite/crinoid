import { describe, expect, it, vi } from 'vitest'
import { createSessionManager } from 'crinoid/auth'

interface User {
  id: string
  name: string
}

interface StoredSession {
  user: User
  tokens: { accessToken: string; refreshToken: string; expiresAt: number }
}

function createStorage() {
  const values = new Map<string, StoredSession>()
  return {
    values,
    storage: {
      get: async (key: string) => values.get(key) ?? null,
      set: async (key: string, value: StoredSession) => {
        values.set(key, value)
      },
      remove: async (key: string) => {
        values.delete(key)
      }
    }
  }
}

const AUTH_RESULT = {
  user: { id: '1', name: 'Ada' },
  tokens: { accessToken: 'a', refreshToken: 'r', expiresAt: 9_999 }
}

describe('session manager', () => {
  it('logs in, persists, and reports the current user', async () => {
    const { storage, values } = createStorage()
    const manager = createSessionManager<User>({ storage, authenticate: async () => AUTH_RESULT })

    const session = await manager.login({ username: 'ada', password: 'pw' })

    expect(session?.user.name).toBe('Ada')
    expect(manager.current()?.user.id).toBe('1')
    expect(values.get('session')).toBeDefined()
  })

  it('logs out and clears the persisted session', async () => {
    const { storage, values } = createStorage()
    const manager = createSessionManager<User>({ storage, authenticate: async () => AUTH_RESULT })

    await manager.login({ username: 'ada', password: 'pw' })
    await manager.logout()

    expect(manager.current()).toBeNull()
    expect(values.has('session')).toBe(false)
  })

  it('restores a persisted session on startup', async () => {
    const { storage, values } = createStorage()
    values.set('session', { user: { id: '2', name: 'Lin' }, tokens: { accessToken: 'x', refreshToken: 'y', expiresAt: 9_999 } })

    const manager = createSessionManager<User>({ storage, authenticate: async () => null })
    const restored = await manager.restore()

    expect(restored?.user.name).toBe('Lin')
    expect(manager.current()?.user.id).toBe('2')
  })

  it('discards a persisted session that fails validation', async () => {
    const { storage, values } = createStorage()
    values.set('session', { user: { id: '2', name: 'Lin' }, tokens: { accessToken: 'x', refreshToken: 'y', expiresAt: 9_999 } })

    const manager = createSessionManager<User>({
      storage,
      authenticate: async () => null,
      validate: async () => false
    })

    await expect(manager.restore()).resolves.toBeNull()
    expect(values.has('session')).toBe(false)
  })

  it('notifies subscribers on login and logout', async () => {
    const { storage } = createStorage()
    const manager = createSessionManager<User>({ storage, authenticate: async () => AUTH_RESULT })
    const listener = vi.fn()
    manager.subscribe(listener)

    await manager.login({ username: 'ada', password: 'pw' })
    await manager.logout()

    expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({ user: expect.objectContaining({ id: '1' }) }))
    expect(listener).toHaveBeenNthCalledWith(2, null)
  })
})
