// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  LocaleProvider,
  OfflineState,
  ThemeProvider,
  useDirection,
  useTheme
} from 'crinoid/react'

function createStorage(seed: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(seed))
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    }
  } as Storage
}

function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return <button onClick={() => setTheme('dark')}>{theme}</button>
}

function DirectionProbe() {
  return <span>{useDirection()}</span>
}

describe('renderer state views', () => {
  it('renders loading, empty, and offline states with a status role', () => {
    render(
      <>
        <LoadingState label="Loading" />
        <EmptyState label="Empty" />
        <OfflineState label="Offline" />
      </>
    )

    expect(screen.getAllByRole('status').map((node) => node.textContent)).toEqual(['Loading', 'Empty', 'Offline'])
  })

  it('renders an error state with an alert role', () => {
    render(<ErrorState label="Failed" />)

    expect(screen.getByRole('alert').textContent).toBe('Failed')
  })
})

describe('theme provider', () => {
  afterEach(() => {
    document.documentElement.dataset.theme = ''
  })

  it('throws when useTheme is used outside a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<ThemeProbe />)).toThrow('ThemeProvider')

    consoleError.mockRestore()
  })

  it('loads a stored theme and persists changes to storage and the document', () => {
    const storage = createStorage({ 'desktop-theme': 'light' })
    render(
      <ThemeProvider storage={storage}>
        <ThemeProbe />
      </ThemeProvider>
    )

    expect(screen.getByRole('button').textContent).toBe('light')

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button').textContent).toBe('dark')
    expect(storage.getItem('desktop-theme')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

describe('useDirection', () => {
  afterEach(() => {
    document.documentElement.dir = ''
    document.documentElement.lang = ''
  })

  it('reports rtl for right-to-left locales', () => {
    render(
      <LocaleProvider locale="ar" messages={{}}>
        <DirectionProbe />
      </LocaleProvider>
    )

    expect(screen.getByText('rtl')).toBeTruthy()
  })

  it('reports ltr for left-to-right locales', () => {
    render(
      <LocaleProvider locale="en" messages={{}}>
        <DirectionProbe />
      </LocaleProvider>
    )

    expect(screen.getByText('ltr')).toBeTruthy()
  })
})
