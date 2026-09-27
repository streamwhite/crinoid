import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const run = promisify(execFile)
const cli = fileURLToPath(new URL('../../packages/create-crinoid/src/cli.mjs', import.meta.url))

describe('create-crinoid', () => {
  it('copies thin entrypoints that depend on the package', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'electron-template-'))
    try {
      await run(process.execPath, [cli, directory])
      const packageJson = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
      const mainSource = await readFile(join(directory, 'src/main/index.ts'), 'utf8')
      expect(packageJson.name).toMatch(/^electron-template-/)
      expect(packageJson.dependencies['crinoid']).toBeDefined()
      expect(mainSource).toContain('crinoid/main')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
