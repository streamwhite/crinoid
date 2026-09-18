import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
interface ThemeContext { theme: Theme; setTheme: (theme: Theme) => void }
const Context = createContext<ThemeContext | null>(null)
const STORAGE_KEY = 'desktop-theme'

function applyTheme(theme: Theme): void { const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light' }

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system')
  useEffect(() => { localStorage.setItem(STORAGE_KEY, theme); applyTheme(theme) }, [theme])
  return <Context.Provider value={{ theme, setTheme }}>{children}</Context.Provider>
}

export function useTheme(): ThemeContext { const context = useContext(Context); if (!context) throw new Error('useTheme must be used within ThemeProvider'); return context }
