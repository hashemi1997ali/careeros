'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons'

/**
 * Two-step destructive button. First press arms it (it expands and asks for
 * confirmation), a second press within 4 seconds runs `onConfirm`.
 * Replaces blocking `window.confirm` prompts.
 */
export function ConfirmButton({ label, onConfirm, className = '', disabled = false }: { label: string; onConfirm: () => void; className?: string; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!armed) return
    const timer = window.setTimeout(() => setArmed(false), 4000)
    const outside = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setArmed(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setArmed(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { window.clearTimeout(timer); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [armed])

  return <button
    ref={ref}
    type="button"
    disabled={disabled}
    className={`confirm-button ${className}`.trim()}
    data-armed={armed ? 'true' : 'false'}
    aria-label={armed ? `Confirm: ${label}` : label}
    title={armed ? 'Click again to confirm' : label}
    onClick={() => { if (armed) { setArmed(false); onConfirm() } else setArmed(true) }}
  >
    <Icon name="trash" size={17} />
    <span className="confirm-button-text" aria-hidden={!armed}>Delete?</span>
  </button>
}
