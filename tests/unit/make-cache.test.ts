import { describe, expect, it } from 'vitest'
import { cacheKey, getBuildInputs } from '../../scripts/make-cache.mjs'

describe('incremental make cache', () => {
  it('separates packaging contexts', () => {
    expect(cacheKey(['--platform', 'linux'])).not.toBe(cacheKey(['--platform', 'win32']))
  })

  it('tracks source and packaging configuration inputs', async () => {
    const files = await getBuildInputs(process.cwd())
    expect(files).toContain('src/main/index.ts')
    expect(files).toContain('forge.config.ts')
  })
})
