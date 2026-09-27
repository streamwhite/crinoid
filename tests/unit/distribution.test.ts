import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const packagesDir = join(root, 'packages')
const UMBRELLA = 'crinoid'
const SCAFFOLD = 'create-crinoid'
const PUBLISHED = [UMBRELLA, SCAFFOLD]

const readManifest = (name: string) =>
  JSON.parse(readFileSync(join(packagesDir, name, 'package.json'), 'utf8'))

describe('distribution model: one umbrella package', () => {
  const names = () => readdirSync(packagesDir)

  it('the umbrella is the only published runtime package (CLI scaffold aside)', () => {
    const published = names()
      .filter((name) => !readManifest(name).private)
      .sort()
    expect(published).toEqual([...PUBLISHED].sort())
  })

  // a private package is invisible to consumers, so it must be consumed by
  // another package; otherwise it is dead code that silently ships nothing
  it('has no orphan packages', () => {
    const declared = names().flatMap((name) =>
      Object.keys({
        ...readManifest(name).dependencies,
        ...readManifest(name).peerDependencies,
        ...readManifest(name).devDependencies
      })
    )
    const orphans = names()
      .filter((name) => readManifest(name).private)
      .filter((name) => !declared.includes(readManifest(name).name))
    expect(orphans).toEqual([])
  })

  it('electron/react are peerDependencies of the umbrella, never duplicated as dependencies', () => {
    const manifest = readManifest(UMBRELLA)
    expect(manifest.peerDependencies).toMatchObject({
      electron: expect.any(String),
      react: expect.any(String),
      'react-dom': expect.any(String)
    })
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('electron')
    expect(Object.keys(manifest.dependencies ?? {})).not.toContain('react')
  })

  it('the umbrella carries its runtime deps so consumers install only it', () => {
    const deps = Object.keys(readManifest(UMBRELLA).dependencies ?? {})
    expect(deps.length).toBeGreaterThan(0)
    expect(deps).toContain('react-intl')
  })
})

describe('packages publish with plain `pnpm publish`', () => {
  it.each(PUBLISHED)('%s is publishable', (name) => {
    const manifest = readManifest(name)
    expect(manifest.private).toBeFalsy()
    expect(manifest.publishConfig?.access).toBe('public')
    expect(Array.isArray(manifest.files)).toBe(true)
    expect(manifest.files?.length).toBeGreaterThan(0)
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  // a plain publish must ship the version already in package.json: no tooling
  // may rewrite it or touch consumer files on install
  it.each(PUBLISHED)('%s has no publish/install lifecycle hooks', (name) => {
    const scripts = readManifest(name).scripts ?? {}
    for (const hook of ['prepublish', 'prepublishOnly', 'prepare', 'prepack', 'postinstall']) {
      expect(scripts[hook]).toBeUndefined()
    }
  })

  it('the workspace no longer depends on a release toolchain', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(manifest.devDependencies?.['@changesets/cli']).toBeUndefined()
    expect(manifest.scripts?.['publish:packages']).toBeUndefined()
  })
})