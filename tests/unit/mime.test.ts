import { describe, expect, it } from 'vitest'
import { detectMimeType, getFileCategory, isTextMimeType } from 'crinoid/mime'

describe('mime detection', () => {
  it('maps common extensions to mime types', () => {
    expect(detectMimeType('/tmp/a.json')).toBe('application/json')
    expect(detectMimeType('/tmp/a.png')).toBe('image/png')
    expect(detectMimeType('/tmp/a.md')).toBe('text/markdown')
  })

  it('falls back to a generic type for unknown extensions', () => {
    expect(detectMimeType('/tmp/a.unknownext')).toBe('application/octet-stream')
    expect(detectMimeType('/tmp/no-extension')).toBe('application/octet-stream')
  })

  it('classifies categories', () => {
    expect(getFileCategory('image/png')).toBe('image')
    expect(getFileCategory('text/markdown')).toBe('text')
    expect(getFileCategory('application/json')).toBe('data')
    expect(getFileCategory('application/pdf')).toBe('document')
    expect(getFileCategory('video/mp4')).toBe('media')
    expect(getFileCategory('application/octet-stream')).toBe('other')
  })

  it('recognizes text-like mime types', () => {
    expect(isTextMimeType('text/plain')).toBe(true)
    expect(isTextMimeType('application/json')).toBe(true)
    expect(isTextMimeType('image/png')).toBe(false)
  })
})
