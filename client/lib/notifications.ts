export type NotificationKind = 'error' | 'success' | 'info'

export interface AppNotification {
  id: number
  kind: NotificationKind
  title: string
  message: string
}

export const notificationEventName = 'careeros:notification'

export function notify(
  message: string,
  kind: NotificationKind = 'error',
  title = kind === 'error' ? 'Something went wrong' : kind === 'success' ? 'Completed' : 'Information',
) {
  if (typeof window === 'undefined' || !message.trim()) return

  window.dispatchEvent(new CustomEvent(notificationEventName, {
    detail: { kind, title, message: message.trim() },
  }))
}

export function notifyError(message: string, title = 'Something went wrong') {
  notify(message, 'error', title)
}
