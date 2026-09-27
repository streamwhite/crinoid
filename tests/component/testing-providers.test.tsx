// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { useIntl } from 'react-intl'
import { describe, expect, it } from 'vitest'
import {
  createDesktopApiStub,
  installDesktopBridge,
  TestProviders
} from 'crinoid/testing/react'

function Probe() {
  const intl = useIntl()
  return <span>{intl.formatMessage({ id: 'greeting', defaultMessage: 'Hello' })}</span>
}

describe('renderer test utilities', () => {
  it('renders children inside the intl and theme providers', () => {
    render(
      <TestProviders locale="en" messages={{ greeting: 'Hi' }}>
        <Probe />
      </TestProviders>
    )

    expect(screen.getByText('Hi').textContent).toBe('Hi')
  })

  it('creates a deep desktop bridge stub with overrides', async () => {
    const stub = createDesktopApiStub({ app: { getVersion: async () => '9.9.9' } as never })
    const global = window as unknown as Record<string, unknown>
    const restore = installDesktopBridge(stub)

    const desktop = global.desktop as {
      app: { getVersion(): Promise<string> }
      feedback: { submit(request: { message: string }): Promise<unknown> }
    }
    await expect(desktop.app.getVersion()).resolves.toBe('9.9.9')
    await expect(desktop.feedback.submit({ message: 'needs work' })).resolves.toBeDefined()

    restore()
    expect(global.desktop).toBeUndefined()
  })
})
