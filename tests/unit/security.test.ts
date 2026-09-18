import { describe, expect, it } from 'vitest'
import { isAllowedExternalUrl } from '../../src/main/security/external-url'
import { isTrustedSender } from '../../src/main/security/sender'

describe('external URL policy', () => {
  it('allows only approved protocols', () => {
    expect(isAllowedExternalUrl('https://example.com')).toBe(true)
    expect(isAllowedExternalUrl('mailto:user@example.com')).toBe(true)
    expect(isAllowedExternalUrl('file:///etc/passwd')).toBe(false)
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
  })
})

describe('IPC sender policy', () => {
  it('trusts only the application origin', () => {
    expect(isTrustedSender({ url: 'file:///app/index.html' }, 'file:')).toBe(true)
    expect(isTrustedSender({ url: 'https://evil.example' }, 'file:')).toBe(false)
  })
})
