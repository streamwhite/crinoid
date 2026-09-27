import { Component, createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { IntlProvider, useIntl, type IntlConfig, type IntlShape } from 'react-intl'
import { createFormatters, directionForLocale, resolveLocale, type Formatters } from './i18n.js'
import { matchesKeybinding } from './keybindings.js'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const THEME_STORAGE_KEY = 'desktop-theme'

function applyTheme(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children, storage }: { children: ReactNode; storage?: Storage }) {
  const store = storage ?? window.localStorage
  const [theme, setTheme] = useState<Theme>(() => (store.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'system')

  useEffect(() => {
    store.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
  }, [theme, store])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

export interface DesktopProvidersProps {
  locale: string
  messages?: IntlConfig['messages']
  defaultLocale?: string
  children: ReactNode
}

export function DesktopProviders({ children, locale, messages, defaultLocale }: DesktopProvidersProps) {
  return (
    <IntlProvider
      locale={locale}
      {...(messages === undefined ? {} : { messages })}
      {...(defaultLocale === undefined ? {} : { defaultLocale })}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </IntlProvider>
  )
}

export function AppShell({ sidebar, header, children }: { sidebar?: ReactNode; header?: ReactNode; children?: ReactNode }) {
  return (
    <div className="desktop-shell">
      {sidebar ? <aside className="desktop-shell__sidebar">{sidebar}</aside> : null}
      <div className="desktop-shell__main">
        {header ? <header className="desktop-shell__header">{header}</header> : null}
        <main className="desktop-shell__content">{children}</main>
      </div>
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return <p role="status">{label}</p>
}

export function EmptyState({ label }: { label: string }) {
  return <p role="status">{label}</p>
}

export function ErrorState({ label }: { label: string }) {
  return <p role="alert">{label}</p>
}

export function OfflineState({ label }: { label: string }) {
  return <p role="status">{label}</p>
}

export interface ErrorBoundaryProps {
  readonly fallback: (error: Error) => ReactNode
  readonly onError?: ((error: Error) => void) | undefined
  readonly children: ReactNode
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error)
  }

  render(): ReactNode {
    const { error } = this.state
    return error ? this.props.fallback(error) : this.props.children
  }
}

interface LocaleContextValue {
  readonly locale: string
  readonly direction: 'ltr' | 'rtl'
  readonly setLocale: (locale: string) => void
  readonly formatters: Formatters
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface LocaleProviderProps {
  readonly locale: string
  readonly messages?: IntlConfig['messages']
  readonly timeZone?: string
  readonly onLocaleChange?: ((locale: string) => void) | undefined
  readonly children: ReactNode
}

export function LocaleProvider({ children, locale, messages, timeZone, onLocaleChange }: LocaleProviderProps) {
  const [active, setActive] = useState(locale)

  useEffect(() => {
    setActive(locale)
  }, [locale])

  const resolved = resolveLocale(active)
  useEffect(() => {
    document.documentElement.dir = resolved.direction
    document.documentElement.lang = resolved.locale
  }, [resolved.direction, resolved.locale])

  const value: LocaleContextValue = {
    locale: resolved.locale,
    direction: resolved.direction,
    setLocale: (next) => {
      setActive(next)
      onLocaleChange?.(next)
    },
    formatters: createFormatters(resolved.locale, timeZone === undefined ? {} : { timeZone })
  }

  return (
    <IntlProvider locale={resolved.locale} {...(messages === undefined ? {} : { messages })}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </IntlProvider>
  )
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within a LocaleProvider')
  return context
}

export function useDirection(): 'ltr' | 'rtl' {
  return useLocale().direction
}

export interface UseKeyboardShortcutsOptions {
  readonly target?: EventTarget | undefined
  readonly platform?: string | undefined
  readonly preventDefault?: boolean | undefined
}

export function useKeyboardShortcuts(
  bindings: Readonly<Record<string, () => void>>,
  options: UseKeyboardShortcutsOptions = {}
): void {
  useEffect(() => {
    const target = options.target ?? window
    const platform = options.platform ?? navigator.platform
    const shouldPreventDefault = options.preventDefault ?? true
    const handler = (event: Event): void => {
      const keyboard = event as KeyboardEvent
      for (const [binding, action] of Object.entries(bindings)) {
        if (!matchesKeybinding(keyboard, binding, platform)) continue
        if (shouldPreventDefault) keyboard.preventDefault()
        action()
        return
      }
    }
    target.addEventListener('keydown', handler)
    return () => target.removeEventListener('keydown', handler)
  }, [bindings, options.target, options.platform, options.preventDefault])
}

export { directionForLocale, resolveLocale }
