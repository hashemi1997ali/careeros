'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '@/components/icons'

const transitionDuration = 280

export function ModalShell({
  open,
  onClose,
  layerClassName = '',
  surfaceClassName,
  ariaLabel,
  labelledBy,
  children,
}: {
  open: boolean
  onClose: () => void
  layerClassName?: string
  surfaceClassName: string
  ariaLabel?: string
  labelledBy?: string
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    if (open) {
      frame = window.requestAnimationFrame(() => setMounted(true))
      return () => window.cancelAnimationFrame(frame)
    }

    frame = window.requestAnimationFrame(() => setVisible(false))
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setMounted(false), reducedMotion ? 0 : transitionDuration)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!mounted || !open) return
    const frame = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(frame)
  }, [mounted, open])

  useEffect(() => {
    if (!mounted || !open) return
    const isModalScroller = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('.dialog-scroll,.command-results,.profile-modal'))
    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      if (!isModalScroller(event.target)) event.preventDefault()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
      const target = event.target
      const editable = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (scrollKeys.includes(event.key) && !editable && !isModalScroller(target)) event.preventDefault()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false })
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false })
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('wheel', blockBackgroundScroll)
      document.removeEventListener('touchmove', blockBackgroundScroll)
    }
  }, [mounted, onClose, open])

  if (!mounted) return null

  return (
    <div
      className={`modal-layer modal-backdrop ${layerClassName}`.trim()}
      data-open={visible ? 'true' : 'false'}
      role="presentation"
      aria-hidden={!visible}
      inert={!visible}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && open) onClose()
      }}
    >
      <section
        className={`modal-surface ${surfaceClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  )
}

export function ModalCloseButton({ onClose, className = '' }: { onClose: () => void; className?: string }) {
  return (
    <button className={`modal-close ${className}`.trim()} type="button" onClick={onClose} aria-label="Close dialog">
      <Icon name="x" size={18} />
    </button>
  )
}
