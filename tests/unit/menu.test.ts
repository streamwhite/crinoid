import { describe, expect, it, vi } from 'vitest'
import { createMenuService, defaultApplicationMenuTemplate } from 'crinoid/menu'

describe('menu service', () => {
  it('builds and installs the application menu', () => {
    const menu = { buildFromTemplate: vi.fn((template) => ({ template, popup: vi.fn() })), setApplicationMenu: vi.fn() }
    const service = createMenuService(menu)
    const template = [{ role: 'quit' }]

    service.setApplicationMenu(template)

    expect(menu.buildFromTemplate).toHaveBeenCalledWith(template)
    expect(menu.setApplicationMenu).toHaveBeenCalledWith({ template, popup: expect.any(Function) })
  })

  it('clears the application menu for an empty template', () => {
    const menu = { buildFromTemplate: vi.fn(() => ({ popup: vi.fn() })), setApplicationMenu: vi.fn() }

    createMenuService(menu).setApplicationMenu([])

    expect(menu.setApplicationMenu).toHaveBeenCalledWith(null)
  })

  it('pops up a context menu', () => {
    const built = { popup: vi.fn() }
    const menu = { buildFromTemplate: vi.fn(() => built), setApplicationMenu: vi.fn() }

    createMenuService(menu).popupContextMenu([{ role: 'copy' }], { x: 10, y: 20 })

    expect(built.popup).toHaveBeenCalledWith({ x: 10, y: 20 })
  })

  it('provides a role-based default template without hardcoded labels', () => {
    const template = defaultApplicationMenuTemplate(false)

    expect(template.some((item) => item.role === 'fileMenu')).toBe(true)
    for (const item of template) expect(item.label).toBeUndefined()
  })
})
