import { describe, expect, it } from 'vitest'
import { ensureVisibleOnDisplays } from 'crinoid/window'

const area = { x: 0, y: 0, width: 1920, height: 1080 }

describe('window bounds restore', () => {
  it('keeps bounds that intersect a display', () => {
    expect(ensureVisibleOnDisplays({ width: 800, height: 600, x: 100, y: 100 }, [area])).toEqual({
      width: 800,
      height: 600,
      x: 100,
      y: 100
    })
  })

  it('drops off-screen coordinates so the window re-centers', () => {
    expect(ensureVisibleOnDisplays({ width: 800, height: 600, x: 5000, y: 5000 }, [area])).toEqual({
      width: 800,
      height: 600
    })
  })

  it('keeps bounds when no display information is available', () => {
    expect(ensureVisibleOnDisplays({ width: 800, height: 600, x: 5000, y: 5000 }, [])).toEqual({
      width: 800,
      height: 600,
      x: 5000,
      y: 5000
    })
  })

  it('keeps bounds without coordinates untouched', () => {
    expect(ensureVisibleOnDisplays({ width: 800, height: 600 }, [area])).toEqual({ width: 800, height: 600 })
  })
})
