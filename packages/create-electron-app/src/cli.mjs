#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [, , inputName, ...argumentsList] = process.argv
const OPTIONS = new Map(argumentsList.filter((argument) => argument.startsWith('--')).map((argument) => { const [key, value = 'true'] = argument.slice(2).split('='); return [key, value] }))

function fail(message) { console.error(message); process.exitCode = 1 }
function projectName(name) { return name.split('/').filter(Boolean).at(-1) ?? 'electron-app' }
function packageName(name) { return projectName(name).toLowerCase().replace(/[^a-z0-9-]+/g, '-') }

if (!inputName || inputName.startsWith('--')) fail('Usage: create-electron-app <directory> [--locale=en] [--router=true]')
else {
  const destination = resolve(inputName)
  const name = projectName(inputName)
  const template = resolve(dirname(fileURLToPath(import.meta.url)), '../template')
  await mkdir(destination, { recursive: true })
  await cp(template, destination, { recursive: true, force: false })
  const packagePath = resolve(destination, 'package.json')
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
  packageJson.name = packageName(name)
  packageJson.displayName = name
  packageJson.config.defaultLocale = OPTIONS.get('locale') ?? packageJson.config.defaultLocale
  packageJson.config.router = OPTIONS.get('router') !== 'false'
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)
  console.log(`Created ${name} in ${destination}`)
}
