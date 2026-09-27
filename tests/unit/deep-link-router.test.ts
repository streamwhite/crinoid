import { describe, expect, it, vi } from 'vitest'
import { createDeepLinkRouter, findDeepLinkArgument } from 'crinoid/deep-link'

describe('deep link router', () => {
  it('dispatches matching routes', () => {
    const seen: string[] = []
    const router = createDeepLinkRouter('myapp')
    const dispose = router.register('projects', (link) => seen.push(`${link.route}:${link.id}`))

    expect(router.handle('myapp://projects/1')).toBe(true)
    expect(router.handle('https://example.com')).toBe(false)
    expect(router.handle('myapp://unknown')).toBe(false)
    expect(seen).toEqual(['projects:1'])
    expect(router.routes()).toEqual(['projects'])

    dispose()
    expect(router.handle('myapp://projects/1')).toBe(false)
  })

  it('uses the fallback for unmatched routes', () => {
    const fallback = vi.fn()
    const router = createDeepLinkRouter('myapp', fallback)

    expect(router.handle('myapp://unknown/deep')).toBe(true)
    expect(fallback).toHaveBeenCalledWith({ route: 'unknown', id: 'deep' })
  })

  it('finds deep-link arguments in a command line', () => {
    expect(findDeepLinkArgument(['app', '--flag', 'myapp://a/b'], 'myapp')).toBe('myapp://a/b')
    expect(findDeepLinkArgument(['app', '--flag'], 'myapp')).toBeUndefined()
  })
})
