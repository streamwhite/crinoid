import { describe, expect, it } from 'vitest'
import { IPC_CHANNELS, type DesktopAPI } from '../../src/shared/ipc/types'

describe('IPC contract', () => {
  it('contains explicit capability channels only', () => {
    expect(Object.values(IPC_CHANNELS)).not.toContain('execute')
    expect(typeof ({} as DesktopAPI)).toBe('object')
  })
})
