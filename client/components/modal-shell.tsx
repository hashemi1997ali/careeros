'use client'

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/icons'

const transitionDuration = 280

export function ModalShell({
  open,
  onClose,
  layerClassName = '',
  surfaceClassName,
  anchorRef,
  ariaLabel,
  labelledBy,
  children,
}: {
  open: boolean
  onClose: () => void
  layerClassName?: string
  surfaceClassName: string
  anchorRef?: RefObject<HTMLElement | null>
  ariaLabel?: string
  labelledBy?: string
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const surfaceRef = useRef<HTMLElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
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
    if (!mounted || !open || !anchorRef) return
    const updatePosition = () => {
      const anchor = anchorRef.current
      const layer = layerRef.current
      if (!anchor || !layer) return
      const rect = anchor.getBoundingClientRect()
      const surface = surfaceRef.current
      const surfaceWidth = surface?.offsetWidth ?? 250
      const surfaceHeight = surface?.offsetHeight ?? 220
      const left = Math.min(Math.max(12, rect.right - surfaceWidth), window.innerWidth - surfaceWidth - 12)
      const maxTop = Math.max(12, window.innerHeight - Math.min(surfaceHeight, window.innerHeight - 24) - 12)
      const top = Math.min(rect.bottom + 8, maxTop)
      layer.style.setProperty('--modal-anchor-left', `${left}px`)
      layer.style.setProperty('--modal-anchor-top', `${top}px`)
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    const observer = new ResizeObserver(updatePosition)
    if (anchorRef.current) observer.observe(anchorRef.current)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      observer.disconnect()
    }
  }, [mounted, open, anchorRef])

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

  // Phone bottom sheets (see the max-width: 719px rules): drag the handle or header down to dismiss.
  // Anchored popovers (the account menu) are not sheets, so they opt out.
  useEffect(() => {
    const surface = surfaceRef.current
    if (!mounted || !open || anchorRef || !surface) return
    const sheetQuery = window.matchMedia('(max-width: 719px)')
    const settle = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
    let startY = 0, startTime = 0, offset = 0, pointerId: number | null = null

    const onDown = (event: PointerEvent) => {
      if (!sheetQuery.matches || event.button > 0) return
      if (event.clientY - surface.getBoundingClientRect().top > 72) return // grab zone: handle + header
      if (event.target instanceof Element && event.target.closest('button,a,input,select,textarea,label')) return
      pointerId = event.pointerId; startY = event.clientY; startTime = event.timeStamp; offset = 0
      surface.setPointerCapture(event.pointerId)
      surface.style.transition = 'none'
    }
    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      offset = Math.max(0, event.clientY - startY)
      surface.style.transform = `translateY(${offset}px)`
    }
    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      pointerId = null
      const velocity = offset / Math.max(1, event.timeStamp - startTime)
      surface.style.transition = settle
      if (event.type === 'pointerup' && (offset > 120 || (offset > 40 && velocity > 0.6))) {
        surface.style.transform = 'translateY(100%)' // keep going from where the finger let go
        closeRef.current()
      } else {
        surface.style.transform = ''
      }
    }

    surface.addEventListener('pointerdown', onDown)
    surface.addEventListener('pointermove', onMove)
    surface.addEventListener('pointerup', onUp)
    surface.addEventListener('pointercancel', onUp)
    return () => {
      surface.removeEventListener('pointerdown', onDown)
      surface.removeEventListener('pointermove', onMove)
      surface.removeEventListener('pointerup', onUp)
      surface.removeEventListener('pointercancel', onUp)
    }
  }, [mounted, open, anchorRef])

  if (!mounted) return null

  return createPortal(
    <div
      ref={layerRef}
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
