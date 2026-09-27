// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from 'crinoid/react'

function Harness({ onSave }: { onSave: () => void }) {
  useKeyboardShortcuts({ 'Ctrl+S': onSave }, { platform: 'linux' })
  return <input aria-label="field" />
}

describe('useKeyboardShortcuts', () => {
  it('runs a handler when the keybinding is pressed', () => {
    const onSave = vi.fn()
    render(<Harness onSave={onSave} />)

    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    expect(onSave).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 's' })
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
