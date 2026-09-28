import { describe, expect, it, vi } from 'vitest'
import { createDropController, hasDroppedFiles, readDroppedItems, readDroppedText } from 'crinoid/drag-drop'
import { createKeybindingRegistry, formatKeybinding, matchesKeybinding, parseKeybinding, platformName } from 'crinoid/keybindings'

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

  it('reports the platform and resolves modifier and key aliases', () => {
    expect(platformName()).toBe(process.platform)
    expect(parseKeybinding('Command+Option+Return', 'darwin')).toMatchObject({ key: 'enter', meta: true, alt: true })
    expect(parseKeybinding('Control+Del', 'linux')).toMatchObject({ key: 'delete', ctrl: true })
    expect(parseKeybinding('Ctrl+Up', 'linux')).toMatchObject({ key: 'arrowup', ctrl: true })
    expect(parseKeybinding('   ', 'linux')).toEqual({ key: '', ctrl: false, meta: false, alt: false, shift: false })
  })

  it('formats multi-modifier, named-key, and empty bindings', () => {
    expect(formatKeybinding('Ctrl+Shift+A', 'linux')).toBe('Ctrl+Shift+A')
    expect(formatKeybinding('Ctrl+Escape', 'linux')).toBe('Ctrl+Escape')
    expect(formatKeybinding('', 'linux')).toBe('')
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
