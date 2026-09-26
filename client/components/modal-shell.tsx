'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const surfaceRef = useRef<HTMLElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

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
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const shell = document.querySelector<HTMLElement>('.app-shell')
    const previousInert = shell?.inert ?? false
    if (shell) shell.inert = true
    const isModalScroller = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('.dialog-scroll,.command-results,.profile-modal'))
    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      if (isModalScroller(event.target)) return
      event.preventDefault()
    }
    const focusable = () => Array.from(surfaceRef.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0)
    // Wait until the entering surface is painted and no longer inert.
    let focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => (surfaceRef.current?.querySelector<HTMLElement>('input:not(:disabled)') ?? focusable()[0] ?? surfaceRef.current)?.focus({ preventScroll: true }))
    })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current() }
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
      const target = event.target
      const editable = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (scrollKeys.includes(event.key) && !editable && !isModalScroller(target)) event.preventDefault()
      if (event.key === 'Tab') {
        const controls = focusable()
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!first) { event.preventDefault(); surfaceRef.current?.focus(); return }
        if (event.shiftKey && (document.activeElement === first || !surfaceRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && (document.activeElement === last || !surfaceRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('wheel', blockBackgroundScroll, { passive: false })
    document.addEventListener('touchmove', blockBackgroundScroll, { passive: false })
    return () => {
      cancelAnimationFrame(focusFrame)
      if (shell) shell.inert = previousInert
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('wheel', blockBackgroundScroll)
      document.removeEventListener('touchmove', blockBackgroundScroll)
    }
  }, [mounted, open])

  if (!mounted) return null

  return createPortal(
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
        ref={surfaceRef}
        tabIndex={-1}
        className={`modal-surface ${surfaceClassName}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>, document.body
  )
}

export function ModalCloseButton({ onClose, className = '' }: { onClose: () => void; className?: string }) {
  return (
    <button className={`modal-close ${className}`.trim()} type="button" onClick={onClose} aria-label="Close dialog">
      <Icon name="x" size={18} />
    </button>
  )
}
