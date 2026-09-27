export interface NotificationOptions {
  readonly title: string
  readonly body: string
  readonly silent?: boolean
}

export interface NotificationHandlers {
  readonly onClick?: (() => void) | undefined
  readonly onClose?: (() => void) | undefined
}

export interface NotificationInstance {
  show(): void
  on(event: string, listener: () => void): void
}

export interface NotificationConstructor {
  new (options: NotificationOptions): NotificationInstance
}

export interface NotificationPort {
  readonly Notification: NotificationConstructor
  readonly isSupported: () => boolean
}

export interface NotificationService {
  show(options: NotificationOptions, handlers?: NotificationHandlers): boolean
}

export function createNotificationService(port: NotificationPort): NotificationService {
  return {
    show: (options, handlers = {}) => {
      if (!port.isSupported()) return false
      const notification = new port.Notification(options)
      if (handlers.onClick) notification.on('click', handlers.onClick)
      if (handlers.onClose) notification.on('close', handlers.onClose)
      notification.show()
      return true
    }
  }
}
