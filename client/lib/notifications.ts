export type NotificationKind = 'error' | 'success' | 'info'

export interface AppNotification {
  id: number
  kind: NotificationKind
  title: string
  message: string
}

export const notificationEventName = 'careeros:notification'

// Parallel requests failing for the same reason should produce one toast, not three.
const DEDUPE_WINDOW_MS = 4_000
const recent = new Map<string, number>()

export function notify(
  message: string,
  kind: NotificationKind = 'error',
  title = kind === 'error' ? 'Something went wrong' : kind === 'success' ? 'Completed' : 'Information',
) {
  if (typeof window === 'undefined' || !message.trim()) return

  const key = `${kind}|${title}|${message.trim()}`
  const now = Date.now()
  const last = recent.get(key)
  if (last && now - last < DEDUPE_WINDOW_MS) return
  recent.set(key, now)
  if (recent.size > 20) for (const [entry, time] of recent) if (now - time > DEDUPE_WINDOW_MS) recent.delete(entry)

  window.dispatchEvent(new CustomEvent(notificationEventName, {
    detail: { kind, title, message: message.trim() },
  }))
}

export function notifyError(message: string, title = 'Something went wrong') {
  notify(message, 'error', title)
}
