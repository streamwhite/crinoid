import type { Storage } from '../storage.js'
import type { TokenSet } from './token.js'

export interface Credentials {
  readonly username: string
  readonly password: string
}

export interface AuthResult<User> {
  readonly user: User
  readonly tokens: TokenSet
}

export interface Session<User> {
  readonly user: User
  readonly tokens: TokenSet
}

export interface SessionManagerOptions<User> {
  readonly storage: Storage<Session<User>>
  readonly authenticate: (credentials: Credentials) => Promise<AuthResult<User> | null>
  readonly validate?: ((session: Session<User>) => Promise<boolean>) | undefined
  readonly key?: string
}

export type SessionListener<User> = (session: Session<User> | null) => void

export interface SessionManager<User> {
  login(credentials: Credentials): Promise<Session<User> | null>
  logout(): Promise<void>
  restore(): Promise<Session<User> | null>
  current(): Session<User> | null
  subscribe(listener: SessionListener<User>): () => void
  tokens(): TokenSet | null
}

const SESSION_KEY = 'session'

export function createSessionManager<User>(options: SessionManagerOptions<User>): SessionManager<User> {
  const key = options.key ?? SESSION_KEY
  const listeners = new Set<SessionListener<User>>()
  let session: Session<User> | null = null

  const commit = async (next: Session<User> | null): Promise<void> => {
    session = next
    if (next) await options.storage.set(key, next)
    else await options.storage.remove(key)
    for (const listener of [...listeners]) listener(next)
  }

  return {
    login: async (credentials) => {
      const result = await options.authenticate(credentials)
      if (!result) return null
      await commit({ user: result.user, tokens: result.tokens })
      return session
    },
    logout: () => commit(null),
    restore: async () => {
      const persisted = await options.storage.get(key)
      if (!persisted) return null
      if (options.validate && !(await options.validate(persisted))) {
        await commit(null)
        return null
      }
      session = persisted
      for (const listener of [...listeners]) listener(session)
      return session
    },
    current: () => session,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    tokens: () => session?.tokens ?? null
  }
}
