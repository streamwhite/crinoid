export interface RuntimeConfig { appName: string; defaultLocale: string; apiBaseUrl: string | null }
export function createRuntimeConfig(appName: string, defaultLocale = 'en', apiBaseUrl: string | null = null): RuntimeConfig { if (apiBaseUrl && new URL(apiBaseUrl).protocol !== 'https:') throw new Error('API base URL must use HTTPS'); return { appName, defaultLocale, apiBaseUrl } }
