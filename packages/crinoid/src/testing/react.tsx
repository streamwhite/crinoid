import type { ReactNode } from 'react'
import { IntlProvider, type IntlConfig } from 'react-intl'
import type { DesktopAPI } from '../ipc.js'
import { ThemeProvider } from '../react.js'

export interface TestProvidersProps {
  readonly children: ReactNode
  readonly locale?: string
  readonly messages?: IntlConfig['messages']
  readonly timeZone?: string
}

export function TestProviders({ children, locale = 'en', messages = {}, timeZone }: TestProvidersProps) {
  return (
    <IntlProvider locale={locale} messages={messages} {...(timeZone === undefined ? {} : { timeZone })}>
      <ThemeProvider>{children}</ThemeProvider>
    </IntlProvider>
  )
}

function createDeepStub(overrides: Record<string, unknown> = {}): unknown {
  const target = (() => Promise.resolve(createDeepStub())) as unknown as Record<string, unknown>
  return new Proxy(target, {
    get(_target, property) {
      if (property === 'then') return undefined
      if (typeof property === 'string' && Object.prototype.hasOwnProperty.call(overrides, property)) {
        return overrides[property]
      }
      return createDeepStub()
    },
    apply() {
      return Promise.resolve(createDeepStub())
    }
  })
}

export function createDesktopApiStub(overrides: Partial<DesktopAPI> = {}): DesktopAPI {
  return createDeepStub(overrides as Record<string, unknown>) as DesktopAPI
}

export function installDesktopBridge(bridge: DesktopAPI, target: Record<string, unknown> = window as unknown as Record<string, unknown>): () => void {
  const had = Object.prototype.hasOwnProperty.call(target, 'desktop')
  const previous = target.desktop
  target.desktop = bridge
  return () => {
    if (had) target.desktop = previous
    else delete target.desktop
  }
}
