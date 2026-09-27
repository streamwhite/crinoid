import { describe, expect, it, vi } from 'vitest'
import { createNotificationService } from 'crinoid/notifications'

describe('notification service', () => {
  it('shows a notification when supported', () => {
    const show = vi.fn()
    const Notification = vi.fn(function (this: { show: () => void }) {
      this.show = show
    })
    const service = createNotificationService({ Notification: Notification as never, isSupported: () => true })

    expect(service.show({ title: 'Hi', body: 'Body' })).toBe(true)
    expect(Notification).toHaveBeenCalledWith({ title: 'Hi', body: 'Body' })
    expect(show).toHaveBeenCalled()
  })

  it('does nothing when notifications are unsupported', () => {
    const Notification = vi.fn()
    const service = createNotificationService({ Notification: Notification as never, isSupported: () => false })

    expect(service.show({ title: 'Hi', body: 'Body' })).toBe(false)
    expect(Notification).not.toHaveBeenCalled()
  })

  it('forwards click and close handlers', () => {
    const handlers = new Map<string, () => void>()
    const Notification = vi.fn(function (this: {
      show: () => void
      on: (event: string, listener: () => void) => void
    }) {
      this.show = vi.fn()
      this.on = (event, listener) => handlers.set(event, listener)
    })
    const onClick = vi.fn()
    const service = createNotificationService({ Notification: Notification as never, isSupported: () => true })

    service.show({ title: 'Hi', body: 'Body' }, { onClick })
    handlers.get('click')?.()

    expect(onClick).toHaveBeenCalled()
  })
})
