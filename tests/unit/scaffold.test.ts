import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const run = promisify(execFile)
const cli = fileURLToPath(new URL('../../packages/create-electron-app/src/cli.mjs', import.meta.url))

describe('create-electron-app', () => {
  it('copies the template and applies project options', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'electron-template-'))
    try { await run(process.execPath, [cli, directory, '--locale=zh-CN', '--router=false']); const packageJson = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8')); expect(packageJson.name).toMatch(/^electron-template-/); expect(packageJson.config).toEqual({ defaultLocale: 'zh-CN', router: false }) } finally { await rm(directory, { recursive: true, force: true }) }
  })
})
