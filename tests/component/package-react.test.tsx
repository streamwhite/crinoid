// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell, DesktopProviders, LoadingState, ThemeProvider } from 'crinoid/react'

describe('renderer providers', () => {
  it('renders an empty shell with no placeholder content', () => {
    render(
      <DesktopProviders locale="en" messages={{}}>
        <AppShell />
      </DesktopProviders>
    )
    expect(screen.queryByText(/foundation|template|status/i)).toBeNull()
  })

  it('renders a generic state with an explicit label', () => {
    render(
      <ThemeProvider>
        <LoadingState label="Loading" />
      </ThemeProvider>
    )
    expect(screen.getByRole('status').textContent).toBe('Loading')
  })
})
