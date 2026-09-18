import { describe, expect, it } from 'vitest'
import { parseDeepLink } from '../../src/main/protocol/deep-link'

describe('deep links', () => {
  it('accepts only the application protocol and structured routes', () => {
    expect(parseDeepLink('myapp://document/123')).toEqual({ route: 'document', id: '123' })
    expect(parseDeepLink('https://document/123')).toBeNull()
  })
})
