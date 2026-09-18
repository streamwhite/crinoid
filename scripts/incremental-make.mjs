import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { cacheKey, createBuildSignature } from './make-cache.mjs'

const root = process.cwd()
const cacheDirectory = resolve(root, '.cache/electron-make')
const cacheFile = resolve(cacheDirectory, 'records.json')
const forceFlag = '--force'
const argumentsList = process.argv.slice(2).filter((argument) => argument !== forceFlag)
const key = cacheKey(argumentsList)

async function readRecords() { try { return JSON.parse(await readFile(cacheFile, 'utf8')) } catch { return {} } }
async function hasPackageOutput() {
  try {
    const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
    const platformIndex = argumentsList.indexOf('--platform')
    const archIndex = argumentsList.indexOf('--arch')
    const platform = platformIndex === -1 ? process.platform : argumentsList[platformIndex + 1]
    const arch = archIndex === -1 ? 'x64' : argumentsList[archIndex + 1]
    const packageDirectory = `${packageJson.productName ?? packageJson.name}-${platform}-${arch}`
    await access(resolve(root, 'out', packageDirectory), constants.F_OK)
    return true
  } catch { return false }
}
async function hasBuildOutput() { try { await access(resolve(root, '.vite/build/main.js'), constants.F_OK); return true } catch { return false } }
function runForge(extraArguments = []) { return new Promise((resolveExit, reject) => { const child = spawn('electron-forge', ['make', ...extraArguments, ...argumentsList], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }); child.once('error', reject); child.once('exit', (code) => resolveExit(code ?? 1)) }) }

const records = await readRecords()
const signature = await createBuildSignature(root, argumentsList)
const hit = !process.argv.includes(forceFlag) && records[key] === signature && await hasBuildOutput() && await hasPackageOutput()
if (hit) { console.log('Incremental make: source and packaging inputs unchanged; skipped package step.'); process.exitCode = await runForge(['--skip-package']) }
else {
  const exitCode = await runForge()
  if (exitCode === 0) { await mkdir(cacheDirectory, { recursive: true }); records[key] = signature; await writeFile(cacheFile, JSON.stringify(records, null, 2)); }
  process.exitCode = exitCode
}
