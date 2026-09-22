'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/icons'
import { notificationEventName, type AppNotification } from '@/lib/notifications'

type NotificationEventDetail = Omit<AppNotification, 'id'>

export function NotificationViewport() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    let nextId = 0
    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationEventDetail>).detail
      if (!detail?.message) return

      const notification = { ...detail, id: Date.now() + nextId++ }
      setNotifications(current => [...current, notification].slice(-3))
      window.setTimeout(() => {
        setNotifications(current => current.filter(item => item.id !== notification.id))
      }, 6500)
    }

    window.addEventListener(notificationEventName, handleNotification)
    return () => window.removeEventListener(notificationEventName, handleNotification)
  }, [])

  const dismiss = (id: number) => setNotifications(current => current.filter(item => item.id !== id))

  return <div className="notification-viewport" aria-live="polite" aria-atomic="false">
    {notifications.map(notification => <article className={`notification notification-${notification.kind}`} key={notification.id} role={notification.kind === 'error' ? 'alert' : 'status'}>
      <span className="notification-icon"><Icon name={notification.kind === 'success' ? 'check' : notification.kind === 'info' ? 'sparkles' : 'x'} size={17} /></span>
      <div className="notification-copy"><strong>{notification.title}</strong><p>{notification.message}</p></div>
      <button type="button" className="notification-close" onClick={() => dismiss(notification.id)} aria-label="Dismiss notification"><Icon name="x" size={16} /></button>
    </article>)}
  </div>
}
