'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons'
import { notificationEventName, type AppNotification } from '@/lib/notifications'

type NotificationEventDetail = Omit<AppNotification, 'id'>
type VisibleNotification = AppNotification & { leaving?: boolean }

const VISIBLE_MS = 6_500
const EXIT_MS = 240 // keep in sync with --dur in motion.css

export function NotificationViewport() {
  const [notifications, setNotifications] = useState<VisibleNotification[]>([])
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    setNotifications(current => current.map(item => item.id === id ? { ...item, leaving: true } : item))
    window.clearTimeout(timers.current.get(id))
    timers.current.set(id, window.setTimeout(() => {
      timers.current.delete(id)
      setNotifications(current => current.filter(item => item.id !== id))
    }, EXIT_MS))
  }, [])

  useEffect(() => {
    let nextId = 0
    const pending = timers.current
    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationEventDetail>).detail
      if (!detail?.message) return

      const notification = { ...detail, id: Date.now() + nextId++ }
      setNotifications(current => [...current.filter(item => !item.leaving), notification].slice(-3))
      pending.set(notification.id, window.setTimeout(() => dismiss(notification.id), VISIBLE_MS))
    }

    window.addEventListener(notificationEventName, handleNotification)
    return () => {
      window.removeEventListener(notificationEventName, handleNotification)
      pending.forEach(timer => window.clearTimeout(timer))
      pending.clear()
    }
  }, [dismiss])

  return <div className="notification-viewport" aria-live="polite" aria-atomic="false">
    {notifications.map(notification => <article className={`notification notification-${notification.kind}`} data-leaving={notification.leaving ? 'true' : undefined} key={notification.id} role={notification.kind === 'error' ? 'alert' : 'status'}>
      <span className="notification-icon"><Icon name={notification.kind === 'success' ? 'check' : notification.kind === 'info' ? 'sparkles' : 'x'} size={17} /></span>
      <div className="notification-copy"><strong>{notification.title}</strong><p>{notification.message}</p></div>
      <button type="button" className="notification-close" onClick={() => dismiss(notification.id)} aria-label="Dismiss notification"><Icon name="x" size={16} /></button>
    </article>)}
  </div>
}
