// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from 'crinoid/react'

function Broken(): never {
  throw new Error('render failed')
}

describe('renderer error boundary', () => {
  it('renders the fallback when a child throws', () => {
    const onError = vi.fn()
    render(
      <ErrorBoundary fallback={(error) => <p role="alert">{error.message}</p>} onError={onError}>
        <Broken />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert').textContent).toBe('render failed')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary fallback={() => <p>failed</p>}>
        <span>ok</span>
      </ErrorBoundary>
    )

    expect(screen.getByText('ok')).toBeTruthy()
  })
})
