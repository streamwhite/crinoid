import { describe, expect, it } from 'vitest'
import { createPluginRegistry } from '../../src/shared/plugins/registry'

describe('plugin registry', () => {
  it('rejects duplicate plugin identifiers', () => {
    const registry = createPluginRegistry()
    registry.register({ id: 'example', name: 'Example' })
    expect(() => registry.register({ id: 'example', name: 'Other' })).toThrow('Duplicate plugin')
  })
})
