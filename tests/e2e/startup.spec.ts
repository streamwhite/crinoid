import { _electron as electron, expect, test } from '@playwright/test'
import { resolve } from 'node:path'

test('application starts and renders its title', async () => {
  const application = await electron.launch({ args: [resolve('.vite/build/main.js')] })
  const window = await application.firstWindow()
  await expect(window).toHaveTitle('Electron Desktop Template')
  await application.close()
})
