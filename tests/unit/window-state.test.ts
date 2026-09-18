import { describe, expect, it } from 'vitest'
import { loadWindowState } from '../../src/main/windows/state'

describe('window state', () => {
  it('returns safe defaults when no state file exists', async () => {
    expect(await loadWindowState('/tmp/electron-template-missing-window-state.json')).toEqual({ width: 1200, height: 800, isMaximized: false })
  })
})
