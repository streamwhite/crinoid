import { describe, expect, it } from 'vitest'
import {
  bumpVersion,
  planRelease,
  promoteChangelog,
  readPublishedPackages,
  syncDependencyRanges,
  TAG_PREFIX
} from '../../scripts/release-packages.mjs'
import { listPublishedPackages } from '../../scripts/publish-packages.mjs'

describe('release version bump', () => {
  it('bumps patch, minor, major, and accepts explicit versions', () => {
    expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4')
    expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0')
    expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0')
    expect(bumpVersion('1.2.3', '2.5.0')).toBe('2.5.0')
  })

  it('rejects unknown bump keywords', () => {
    expect(() => bumpVersion('1.2.3', 'nope')).toThrow('Unknown bump')
  })
})

describe('dependency range sync', () => {
  it('pins published sibling dependencies to the new caret range', () => {
    const manifest = {
      name: 'a',
      version: '1.0.0',
      dependencies: { '@scope/a': 'workspace:*', react: '^19.0.0' }
    }

    const next = syncDependencyRanges(manifest, '1.1.0', ['@scope/a'])

    expect(next.dependencies).toEqual({ '@scope/a': '^1.1.0', react: '^19.0.0' })
    expect(manifest.dependencies['@scope/a']).toBe('workspace:*')
  })
})

describe('changelog promotion', () => {
  const text = '# Changelog\n\n## Unreleased\n\n### Added\n\n- thing\n\n## 0.1.0\n\n- old\n'

  it('moves unreleased notes under the released version', () => {
    const result = promoteChangelog(text, '0.2.0', '2026-01-01')

    expect(result).toContain('## 0.2.0 - 2026-01-01')
    expect(result).toContain('- thing')
    expect(result.indexOf('## Unreleased')).toBeLessThan(result.indexOf('## 0.2.0'))
    expect(result.indexOf('## 0.2.0')).toBeLessThan(result.indexOf('## 0.1.0'))
  })

  it('returns the input when there is no unreleased section', () => {
    expect(promoteChangelog('# Changelog\n', '0.2.0', '2026-01-01')).toBe('# Changelog\n')
  })
})

describe('release plan', () => {
  it('computes version, tag, manifest writes, and changelog', () => {
    const packages = [
      { file: '/tmp/a/package.json', manifest: { name: 'a', version: '0.1.0', dependencies: { b: '^0.1.0' } } },
      { file: '/tmp/b/package.json', manifest: { name: 'b', version: '0.1.0' } }
    ]

    const plan = planRelease({
      packages,
      targetFiles: [],
      publishedNames: ['a', 'b'],
      bump: 'minor',
      changelog: '## Unreleased\n\n- x\n',
      date: '2026-01-01'
    })

    expect(plan.version).toBe('0.2.0')
    expect(plan.tag).toBe(`${TAG_PREFIX}0.2.0`)
    expect(plan.manifestWrites[0].manifest.version).toBe('0.2.0')
    expect(plan.manifestWrites[0].manifest.dependencies.b).toBe('^0.2.0')
    expect(plan.changelog).toContain('## 0.2.0 - 2026-01-01')
  })

  it('rejects published packages with mismatched versions', () => {
    expect(() =>
      planRelease({
        packages: [
          { file: '/tmp/a/package.json', manifest: { name: 'a', version: '0.1.0' } },
          { file: '/tmp/b/package.json', manifest: { name: 'b', version: '0.2.0' } }
        ],
        targetFiles: [],
        publishedNames: ['a', 'b'],
        bump: 'patch',
        changelog: '## Unreleased\n',
        date: '2026-01-01'
      })
    ).toThrow('share a version')
  })
})

describe('published package discovery', () => {
  it('finds exactly the two public packages', () => {
    const names = readPublishedPackages()
      .map((entry) => entry.manifest.name)
      .sort()
    expect(names).toEqual(['create-crinoid', 'crinoid'])
    expect(listPublishedPackages()).toHaveLength(2)
  })
})
