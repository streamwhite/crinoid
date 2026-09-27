#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGES_DIR = join(ROOT, 'packages')
const CHANGELOG_FILE = join(PACKAGES_DIR, 'crinoid', 'CHANGELOG.md')
const TEMPLATE_MANIFEST = join(PACKAGES_DIR, 'create-crinoid', 'template', 'package.json')

export const TAG_PREFIX = 'pkg-v'
export const BUMPS = ['major', 'minor', 'patch']
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

export function isSemver(value) {
  return SEMVER.test(value)
}

export function bumpVersion(current, bump) {
  if (isSemver(bump)) return bump
  if (!BUMPS.includes(bump)) throw new Error(`Unknown bump "${bump}". Use major, minor, patch, or an explicit version.`)
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current)
  if (!match) throw new Error(`Cannot bump unsupported version "${current}"`)
  const [major, minor, patch] = match.slice(1).map(Number)
  if (bump === 'major') return `${major + 1}.0.0`
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

export function syncDependencyRanges(manifest, version, publishedNames) {
  const next = { ...manifest }
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = manifest[field]
    if (!dependencies) continue
    const updated = { ...dependencies }
    let changed = false
    for (const name of publishedNames) {
      if (Object.prototype.hasOwnProperty.call(updated, name)) {
        updated[name] = `^${version}`
        changed = true
      }
    }
    if (changed) next[field] = updated
  }
  return next
}

export function promoteChangelog(text, version, date) {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line.trim() === '## Unreleased')
  if (start === -1) return text
  let end = lines.length
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) {
      end = index
      break
    }
  }
  const body = lines.slice(start + 1, end).join('\n').trim()
  const head = lines.slice(0, start)
  const tail = lines.slice(end)
  const released = body ? `## ${version} - ${date}\n\n${body}` : `## ${version} - ${date}`
  return [...head, '## Unreleased', '', released, '', ...tail].join('\n').replace(/\n{3,}/g, '\n\n')
}

export function readPublishedPackages(packagesDir = PACKAGES_DIR) {
  return readdirSync(packagesDir)
    .map((entry) => join(packagesDir, entry, 'package.json'))
    .filter((file) => existsSync(file))
    .map((file) => ({ file, manifest: JSON.parse(readFileSync(file, 'utf8')) }))
    .filter(({ manifest }) => manifest.private !== true)
}

export function readManifests(files) {
  return files.filter((file) => existsSync(file)).map((file) => ({ file, manifest: JSON.parse(readFileSync(file, 'utf8')) }))
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: ROOT, stdio: 'inherit', ...options })
}

function output(command, args) {
  return execFileSync(command, args, { cwd: ROOT, encoding: 'utf8' }).trim()
}

function writeManifest(file, manifest) {
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
}

export function planRelease({ packages, targetFiles, publishedNames, bump, changelog, date }) {
  if (packages.length === 0) throw new Error('No published packages found under packages/')
  const versions = new Set(packages.map(({ manifest }) => manifest.version))
  if (versions.size !== 1) throw new Error(`Published packages must share a version, found: ${[...versions].join(', ')}`)
  const current = packages[0].manifest.version
  const version = bumpVersion(current, bump)

  const manifestWrites = packages.map(({ file, manifest }) => ({
    file,
    manifest: syncDependencyRanges({ ...manifest, version }, version, publishedNames)
  }))
  const publishedFiles = new Set(packages.map(({ file }) => file))
  for (const { file, manifest } of readManifests(targetFiles)) {
    if (publishedFiles.has(file)) continue
    manifestWrites.push({ file, manifest: syncDependencyRanges(manifest, version, publishedNames) })
  }

  const nextChangelog = promoteChangelog(changelog, version, date)
  return { current, version, tag: `${TAG_PREFIX}${version}`, manifestWrites, changelog: nextChangelog }
}

function parseArguments(argv) {
  const flags = new Set(argv.filter((argument) => argument.startsWith('--')))
  const positional = argv.filter((argument) => !argument.startsWith('--'))
  return {
    bump: positional[0] ?? 'patch',
    dryRun: flags.has('--dry-run'),
    skipVerify: flags.has('--no-verify'),
    skipPush: flags.has('--no-push'),
    allowDirty: flags.has('--allow-dirty')
  }
}

export function runRelease(argv = process.argv.slice(2)) {
  const options = parseArguments(argv)
  const packages = readPublishedPackages()
  const publishedNames = packages.map(({ manifest }) => manifest.name)
  const date = new Date().toISOString().slice(0, 10)
  const plan = planRelease({
    packages,
    targetFiles: [TEMPLATE_MANIFEST],
    publishedNames,
    bump: options.bump,
    changelog: readFileSync(CHANGELOG_FILE, 'utf8'),
    date
  })

  console.log(`Releasing packages ${plan.current} -> ${plan.version} (tag ${plan.tag})`)
  for (const write of plan.manifestWrites) console.log(`  update ${write.file.replace(`${ROOT}/`, '')}`)
  console.log(`  update ${CHANGELOG_FILE.replace(`${ROOT}/`, '')}`)

  if (options.dryRun) {
    console.log('\n--dry-run: no files written, nothing committed.')
    return
  }

  if (!options.allowDirty) {
    const dirty = output('git', ['status', '--porcelain'])
    if (dirty) {
      throw new Error('Working tree is not clean. Commit or stash changes, or pass --allow-dirty.')
    }
  }

  for (const write of plan.manifestWrites) writeManifest(write.file, write.manifest)
  writeFileSync(CHANGELOG_FILE, plan.changelog)

  if (!options.skipVerify) {
    run('pnpm', ['typecheck'])
    run('pnpm', ['typecheck:package'])
    run('pnpm', ['typecheck:reference'])
    run('pnpm', ['test'])
  }

  run('git', ['add', '--all'])
  run('git', ['commit', '-m', `chore(release): packages ${plan.tag}`])
  run('git', ['tag', '-a', plan.tag, '-m', `Packages ${plan.version}`])

  if (!options.skipPush) {
    run('git', ['push', 'origin', 'HEAD', plan.tag])
    console.log(`\nPushed ${plan.tag}. CI will publish every non-private package at its new version.`)
  } else {
    console.log(`\nCommitted and tagged ${plan.tag}. Push with: git push origin HEAD ${plan.tag}`)
  }
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  try {
    runRelease()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}
