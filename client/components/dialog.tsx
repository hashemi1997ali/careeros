'use client'

import { useEffect, type ReactNode } from 'react'
import { Icon } from '@/components/icons'

export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  wide = false,
  children,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  description?: string
  wide?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="dialog-backdrop modal-backdrop" data-open="true" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className={wide ? 'dialog dialog-wide modal-surface' : 'dialog modal-surface'} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close dialog">
          <Icon name="x" />
        </button>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id="dialog-title">{title}</h2>
        {description && <p className="dialog-description">{description}</p>}
        {children}
      </section>
    </div>
  )
}
