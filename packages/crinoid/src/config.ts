export interface AppConfig {
  appName: string
  defaultLocale: string
  apiBaseUrl: string | null
}

export interface FeatureFlags {
  tray: boolean
  autoUpdate: boolean
  deepLink: boolean
  commandPalette: boolean
}

export interface DesktopConfig extends AppConfig {
  features: FeatureFlags
  protocol: string
}

export const DEFAULT_FEATURES: FeatureFlags = {
  tray: false,
  autoUpdate: false,
  deepLink: false,
  commandPalette: false
}

export function createDesktopConfig(options: {
  appName: string
  defaultLocale?: string
  apiBaseUrl?: string | null
  features?: Partial<FeatureFlags>
  protocol?: string
}): DesktopConfig {
  if (options.apiBaseUrl && new URL(options.apiBaseUrl).protocol !== 'https:') {
    throw new Error('API base URL must use HTTPS')
  }
  return {
    appName: options.appName,
    defaultLocale: options.defaultLocale?.trim() || 'en',
    apiBaseUrl: options.apiBaseUrl?.trim() || null,
    protocol: options.protocol ?? 'myapp',
    features: { ...DEFAULT_FEATURES, ...options.features }
  }
}
