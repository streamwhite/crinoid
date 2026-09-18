import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const IGNORED_DIRECTORIES = new Set(['.git', '.cache', '.vite', 'dist', 'node_modules', 'out'])
const INPUT_FILES = ['package.json', 'pnpm-lock.yaml', 'forge.config.ts', 'vite.config.mts', 'vite.main.config.mts', 'vite.preload.config.mts', 'postcss.config.mjs', 'tailwind.config.ts', 'tsconfig.json']

async function collectFiles(root, directory) {
  const files = []
  const entries = await readdir(join(root, directory), { withFileTypes: true })
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) { if (!IGNORED_DIRECTORIES.has(entry.name)) files.push(...await collectFiles(root, path)) } else files.push(path)
  }
  return files
}

export async function getBuildInputs(root) {
  const files = [...INPUT_FILES, ...(await collectFiles(root, 'src')), ...(await collectFiles(root, 'packages'))].sort()
  return files.filter((file, index) => files.indexOf(file) === index)
}

export async function createBuildSignature(root, context) {
  const environment = { signing: Boolean(process.env.CSC_LINK), notarization: Boolean(process.env.APPLE_ID), repository: process.env.GITHUB_REPOSITORY ?? '' }
  const hash = createHash('sha256').update(JSON.stringify({ context, environment, node: process.version })).update('\0')
  for (const file of await getBuildInputs(root)) hash.update(file).update('\0').update(await readFile(join(root, file))).update('\0')
  return hash.digest('hex')
}

export function cacheKey(argumentsList) { return JSON.stringify(argumentsList) }
