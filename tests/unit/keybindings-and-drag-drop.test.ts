import { describe, expect, it, vi } from 'vitest'
import { createDropController, hasDroppedFiles, readDroppedItems, readDroppedText } from 'crinoid/drag-drop'
import { createKeybindingRegistry, formatKeybinding, matchesKeybinding, parseKeybinding } from 'crinoid/keybindings'

describe('keybindings', () => {
  it('resolves CmdOrCtrl per platform', () => {
    expect(parseKeybinding('CmdOrCtrl+K', 'darwin')).toMatchObject({ key: 'k', meta: true, ctrl: false })
    expect(parseKeybinding('CmdOrCtrl+K', 'linux')).toMatchObject({ key: 'k', meta: false, ctrl: true })
  })

  it('matches keyboard events with exact modifiers', () => {
    const event = { key: 'K', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }
    expect(matchesKeybinding(event, 'Ctrl+K', 'linux')).toBe(true)
    expect(matchesKeybinding(event, 'Ctrl+Shift+K', 'linux')).toBe(false)
    expect(matchesKeybinding({ key: ' ' }, 'Space', 'linux')).toBe(true)
  })

  it('formats bindings and dispatches registry handlers', () => {
    expect(formatKeybinding('CmdOrCtrl+Shift+P', 'darwin')).toBe('Meta+Shift+P')
    const action = vi.fn()
    const registry = createKeybindingRegistry('linux')
    registry.register('Ctrl+S', action)

    expect(registry.handle({ key: 's', ctrlKey: true })).toBe(true)
    expect(action).toHaveBeenCalledTimes(1)
    registry.unregister('Ctrl+S')
    expect(registry.handle({ key: 's', ctrlKey: true })).toBe(false)
  })
})

describe('drag and drop', () => {
  it('reads dropped files and text', () => {
    const dataTransfer = { files: [{ name: 'a.txt', path: '/a.txt' }, { name: 'b.txt' }], getData: () => 'hello' }

    expect(readDroppedItems(dataTransfer)).toEqual([
      { name: 'a.txt', path: '/a.txt' },
      { name: 'b.txt', path: null }
    ])
    expect(hasDroppedFiles(dataTransfer)).toBe(true)
    expect(readDroppedText(dataTransfer)).toBe('hello')
    expect(hasDroppedFiles({ files: [] })).toBe(false)
  })

  it('prevents default and forwards items through the controller', () => {
    const controller = createDropController()
    const preventDefault = vi.fn()
    const received: string[] = []

    controller.onDragOver({ preventDefault, dataTransfer: null })
    const items = controller.onDrop(
      { preventDefault, dataTransfer: { files: [{ name: 'a.txt' }] } },
      (dropped) => received.push(...dropped.map((item) => item.name))
    )

    expect(preventDefault).toHaveBeenCalledTimes(2)
    expect(items).toHaveLength(1)
    expect(received).toEqual(['a.txt'])
  })
})
