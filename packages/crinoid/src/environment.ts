export const APP_ENVIRONMENTS = ['development', 'test', 'production'] as const

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

export interface EnvironmentInfo {
  readonly name: AppEnvironment
  readonly isDevelopment: boolean
  readonly isTest: boolean
  readonly isProduction: boolean
  readonly isPackaged: boolean
}

export interface EnvironmentSource {
  readonly nodeEnv?: string | undefined
  readonly isPackaged?: boolean | undefined
}

export function isAppEnvironment(value: string): value is AppEnvironment {
  return (APP_ENVIRONMENTS as readonly string[]).includes(value)
}

export function resolveEnvironment(source: EnvironmentSource = {}): EnvironmentInfo {
  const isPackaged = source.isPackaged ?? false
  const fallback: AppEnvironment = isPackaged ? 'production' : 'development'
  const name = source.nodeEnv && isAppEnvironment(source.nodeEnv) ? source.nodeEnv : fallback
  return {
    name,
    isDevelopment: name === 'development',
    isTest: name === 'test',
    isProduction: name === 'production',
    isPackaged
  }
}

export function environmentFromProcess(
  env: Record<string, string | undefined> = process.env,
  isPackaged = false
): EnvironmentInfo {
  return resolveEnvironment({ nodeEnv: env.NODE_ENV, isPackaged })
}

export function readEnvValue(env: Record<string, string | undefined>, key: string): string | null {
  return env[key]?.trim() || null
}
