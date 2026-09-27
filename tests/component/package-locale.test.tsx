// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LocaleProvider, useLocale } from 'crinoid/react'

function Probe() {
  const { locale, direction, setLocale } = useLocale()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="direction">{direction}</span>
      <button onClick={() => setLocale('ar')}>switch</button>
    </div>
  )
}

describe('locale provider', () => {
  afterEach(() => {
    document.documentElement.dir = ''
    document.documentElement.lang = ''
  })

  it('applies the locale to the document and switches direction', () => {
    render(
      <LocaleProvider locale="en" messages={{}}>
        <Probe />
      </LocaleProvider>
    )

    expect(screen.getByTestId('direction').textContent).toBe('ltr')
    expect(document.documentElement.lang).toBe('en')

    fireEvent.click(screen.getByText('switch'))

    expect(screen.getByTestId('locale').textContent).toBe('ar')
    expect(screen.getByTestId('direction').textContent).toBe('rtl')
    expect(document.documentElement.dir).toBe('rtl')
  })
})
