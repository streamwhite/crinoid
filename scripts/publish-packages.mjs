#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGES_DIR = join(ROOT, 'packages')

export function isPublished(name, version, registry) {
  const args = ['view', `${name}@${version}`, 'version']
  if (registry) args.push('--registry', registry)
  try {
    execFileSync('npm', args, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function listPublishedPackages(packagesDir = PACKAGES_DIR) {
  return readdirSync(packagesDir)
    .map((entry) => join(packagesDir, entry, 'package.json'))
    .filter((file) => existsSync(file))
    .map((file) => ({ dir: dirname(file), manifest: JSON.parse(readFileSync(file, 'utf8')) }))
    .filter(({ manifest }) => manifest.private !== true)
}

export function publishPackages({ dryRun = false, registry } = {}) {
  let published = 0
  for (const { dir, manifest } of listPublishedPackages()) {
    const reference = `${manifest.name}@${manifest.version}`
    if (isPublished(manifest.name, manifest.version, registry)) {
      console.log(`skip ${reference} (already on the registry)`)
      continue
    }
    console.log(`publish ${reference}`)
    if (!dryRun) {
      const args = ['publish', '--no-git-checks', '--access', 'public']
      if (registry) args.push('--registry', registry)
      execFileSync('pnpm', args, { cwd: dir, stdio: 'inherit' })
    }
    published += 1
  }
  console.log(`${dryRun ? 'would publish' : 'published'} ${published} package(s)`)
}

export function registryFromArgv(argv) {
  const inline = argv.find((argument) => argument.startsWith('--registry='))
  if (inline) return inline.slice('--registry='.length)
  const index = argv.indexOf('--registry')
  return index === -1 ? undefined : argv[index + 1]
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
  const argv = process.argv.slice(2)
  publishPackages({ dryRun: argv.includes('--dry-run'), registry: registryFromArgv(argv) })
}
