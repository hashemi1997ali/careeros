'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ModalCloseButton, ModalShell } from '@/components/modal-shell'

export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  description,
  wide = false,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  description?: string
  wide?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ hasContentAbove: false, hasContentBelow: false })

  const updateScrollState = useCallback(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    const remainingScroll = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
    const nextState = {
      hasContentAbove: scroller.scrollTop > 2,
      hasContentBelow: remainingScroll > 2,
    }

    setScrollState(current => current.hasContentAbove === nextState.hasContentAbove && current.hasContentBelow === nextState.hasContentBelow
      ? current
      : nextState)
  }, [])

  useEffect(() => {
    if (!open) return

    const scroller = scrollRef.current
    if (!scroller) return

    const frame = window.requestAnimationFrame(updateScrollState)
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(scroller)
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [open, updateScrollState])

  return (
    <ModalShell open={open} onClose={onClose} surfaceClassName={wide ? 'dialog dialog-wide' : 'dialog'} labelledBy={titleId}>
      <header className="dialog-header" data-fade={scrollState.hasContentAbove ? 'true' : 'false'}>
        <div className="dialog-heading">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 id={titleId}>{title}</h2>
          {description && <p className="dialog-description">{description}</p>}
        </div>
        <ModalCloseButton className="dialog-close" onClose={onClose} />
      </header>
      <div className="dialog-scroll" ref={scrollRef} onScroll={updateScrollState}>
        <div className="dialog-content">{children}</div>
      </div>
      {footer && <footer className="dialog-footer" data-fade={scrollState.hasContentBelow ? 'true' : 'false'}>{footer}</footer>}
    </ModalShell>
  )
}
