// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import messages from '../../src/renderer/locales/en/common.json'
import { App } from '../../src/renderer/app/App'

describe('application shell', () => {
  beforeEach(() => { localStorage.setItem('desktop-theme', 'dark'); vi.stubGlobal('matchMedia', () => ({ matches: false })) })

  it('renders the foundation status for the user', () => {
    vi.stubGlobal('desktop', { window: { minimize: vi.fn() } })
    render(<IntlProvider locale="en" messages={messages}><App /></IntlProvider>)
    expect(screen.getByText('Foundation ready')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeTruthy()
  })
})
