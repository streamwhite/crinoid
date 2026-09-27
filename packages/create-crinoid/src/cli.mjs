#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , inputName, ...argumentsList] = process.argv
const OPTIONS = new Set(argumentsList.filter((argument) => argument.startsWith('--')))

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

function projectName(name) {
  return name.split('/').filter(Boolean).at(-1) ?? 'crinoid-app'
}

function packageName(name) {
  return projectName(name).toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

function printNextSteps(name, destination) {
  const isCurrentDirectory = name === '.'
  console.log('')
  console.log('Created a new Electron app. Run:')
  console.log('')
  if (!isCurrentDirectory) console.log(`  cd ${name}`)
  console.log('  pnpm install')
  console.log('  pnpm dev')
  console.log('')
  console.log(`Generated at ${destination}`)
}

if (!inputName || inputName.startsWith('--')) {
  fail('Usage: create-crinoid <directory>')
} else {
  const destination = resolve(inputName)
  const name = inputName === '.' ? '.' : projectName(inputName)
  const template = resolve(dirname(fileURLToPath(import.meta.url)), '../template')
  await mkdir(destination, { recursive: true })
  await cp(template, destination, { recursive: true, force: false })
  const packagePath = resolve(destination, 'package.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  packageJson.name = packageName(name)
  packageJson.displayName = name === '.' ? 'Electron App' : name
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
  if (OPTIONS.size > 0) console.log(`Ignored unknown options: ${[...OPTIONS].join(' ')}`)
  printNextSteps(name, destination)
}
