import { describe, expect, it, vi } from 'vitest'
import { createContextMenuHandler, isContextMenuRequest } from 'crinoid/context-menu'

type TemplateItem = Record<string, unknown>

describe('context menu handler', () => {
  it('resolves the selected item id', async () => {
    let template: TemplateItem[] = []
    const handle = {
      popup: vi.fn((options: { callback?: () => void }) => {
        ;(template[0]?.click as () => void)()
        options.callback?.()
      })
    }
    const menu = {
      buildFromTemplate: vi.fn((value: TemplateItem[]) => {
        template = value
        return handle
      })
    }

    const show = createContextMenuHandler({ menu })

    await expect(show({ items: [{ id: 'copy', label: 'Copy' }], x: 1, y: 2 })).resolves.toBe('copy')
  })

  it('resolves null when the menu closes without a selection', async () => {
    const handle = { popup: vi.fn((options: { callback?: () => void }) => options.callback?.()) }
    const menu = { buildFromTemplate: vi.fn(() => handle) }

    await expect(createContextMenuHandler({ menu })({ items: [{ id: 'copy', label: 'Copy' }], x: 0, y: 0 })).resolves.toBeNull()
  })
})

describe('context menu request validation', () => {
  it('accepts a well-formed request', () => {
    expect(isContextMenuRequest({ items: [{ id: 'a', label: 'A' }], x: 0, y: 0 })).toBe(true)
  })

  it('rejects malformed requests', () => {
    expect(isContextMenuRequest({ items: [{ id: 'a' }], x: 0, y: 0 })).toBe(false)
    expect(isContextMenuRequest({ items: 'nope', x: 0, y: 0 })).toBe(false)
    expect(isContextMenuRequest({ items: [], x: '0', y: 0 })).toBe(false)
    expect(isContextMenuRequest(null)).toBe(false)
  })
})
