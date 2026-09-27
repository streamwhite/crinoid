import { describe, expect, it } from 'vitest'
import {
  basename,
  dirname,
  ensureExtension,
  extension,
  isSubPath,
  joinPath,
  normalizePath,
  relativePath,
  uniquePath
} from 'crinoid/paths'

describe('path utilities', () => {
  it('joins segments and normalizes separators', () => {
    expect(joinPath('/root', 'a', 'b.txt')).toBe('/root/a/b.txt')
    expect(normalizePath('a//b/../c')).toBe('a/c')
  })

  it('splits name, directory, and extension', () => {
    expect(basename('/root/a/b.txt')).toBe('b.txt')
    expect(dirname('/root/a/b.txt')).toBe('/root/a')
    expect(extension('/root/a/b.txt')).toBe('.txt')
    expect(extension('/root/a/b')).toBe('')
  })

  it('keeps the extension when ensuring it', () => {
    expect(ensureExtension('/tmp/report', '.pdf')).toBe('/tmp/report.pdf')
    expect(ensureExtension('/tmp/report.PDF', '.pdf')).toBe('/tmp/report.PDF')
  })

  it('detects sub-paths without false prefix matches', () => {
    expect(isSubPath('/root', '/root/a/b')).toBe(true)
    expect(isSubPath('/root', '/root')).toBe(true)
    expect(isSubPath('/root', '/rooted')).toBe(false)
  })

  it('computes relative paths', () => {
    expect(relativePath('/root', '/root/a/b')).toBe('a/b')
  })

  it('generates a unique path when the target exists', () => {
    const existing = new Set(['/tmp/report.pdf', '/tmp/report (1).pdf'])
    expect(uniquePath('/tmp/report.pdf', (candidate) => existing.has(candidate))).toBe('/tmp/report (2).pdf')
    expect(uniquePath('/tmp/fresh.pdf', () => false)).toBe('/tmp/fresh.pdf')
  })
})
