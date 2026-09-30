'use client'

import { useSyncExternalStore, type MouseEvent } from 'react'
import { Icon } from '@/components/icons'
import { readThemePreference, resolveTheme, setThemePreference, subscribeTheme, type ThemePreference } from '@/lib/theme'

const serverPreference = (): ThemePreference => 'system'

export function useThemePreference() {
  return useSyncExternalStore(subscribeTheme, readThemePreference, serverPreference)
}

export function useResolvedTheme() {
  return useSyncExternalStore(subscribeTheme, () => resolveTheme(readThemePreference()), () => 'light' as const)
}

const originOf = (event: MouseEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

/** Binary light/dark switch with an animated knob. */
export function ThemeSwitch({ className = '' }: { className?: string }) {
  const resolved = useResolvedTheme()
  const dark = resolved === 'dark'
  return <button
    type="button"
    role="switch"
    aria-checked={dark}
    aria-label="Dark theme"
    title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    className={`theme-switch ${className}`.trim()}
    data-state={dark ? 'dark' : 'light'}
    onClick={event => setThemePreference(dark ? 'light' : 'dark', originOf(event))}
  >
    <span className="theme-switch-track" aria-hidden="true">
      <span className="theme-switch-star" /><span className="theme-switch-star" /><span className="theme-switch-star" />
    </span>
    <span className="theme-switch-knob" aria-hidden="true">
      <span className="theme-switch-glyph theme-switch-sun"><Icon name="sun" size={14} /></span>
      <span className="theme-switch-glyph theme-switch-moon"><Icon name="moon" size={14} /></span>
    </span>
  </button>
}
