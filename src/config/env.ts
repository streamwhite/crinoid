export interface AppConfig { defaultLocale: string; apiBaseUrl: string | null }

const DEFAULT_LOCALE = 'en'

export function readConfig(env: Record<string, string | undefined>): AppConfig {
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim() || null
  if (apiBaseUrl && new URL(apiBaseUrl).protocol !== 'https:') throw new Error('API base URL must use HTTPS')
  return { defaultLocale: env.VITE_APP_DEFAULT_LOCALE?.trim() || DEFAULT_LOCALE, apiBaseUrl }
}

export const config = readConfig(import.meta.env as Record<string, string | undefined>)
