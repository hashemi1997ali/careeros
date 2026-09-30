export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const themeStorageKey = 'careeros-theme'
export const themeChangeEvent = 'careeros-preference-change'

const isPreference = (value: unknown): value is ThemePreference => value === 'light' || value === 'dark' || value === 'system'

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(themeStorageKey)
    return isPreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readResolvedTheme(): ResolvedTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themePreference = preference
  root.style.colorScheme = resolved
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = resolved === 'dark' ? '#0a0a0a' : '#ffffff'
}

export function subscribeTheme(listener: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  window.addEventListener('storage', listener)
  window.addEventListener(themeChangeEvent, listener)
  media.addEventListener('change', listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(themeChangeEvent, listener)
    media.removeEventListener('change', listener)
  }
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { ready: Promise<void>; finished: Promise<void> } }

/**
 * Persists and applies a theme. When the browser supports View Transitions the
 * new theme is revealed with a circular wipe that starts at `origin`.
 */
export function setThemePreference(next: ThemePreference, origin?: { x: number; y: number }) {
  try { localStorage.setItem(themeStorageKey, next) } catch {}
  const commit = () => { applyTheme(next); window.dispatchEvent(new Event(themeChangeEvent)) }
  const doc = document as ViewTransitionDocument
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const changes = resolveTheme(next) !== readResolvedTheme()
  if (!doc.startViewTransition || reduced || !changes) { commit(); return }

  const x = origin?.x ?? window.innerWidth - 80
  const y = origin?.y ?? 40
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  document.documentElement.dataset.themeTransition = 'true'
  const transition = doc.startViewTransition(commit)
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  }).catch(() => {})
  // Clear the flag only once the snapshots are gone. Clearing it when the wipe ends (one frame earlier)
  // re-enabled the browser's default cross-fade, which flashed the old theme back for a moment.
  transition.finished.finally(() => { delete document.documentElement.dataset.themeTransition })
}

export const themeBootScript = `
(() => {
  try {
    const saved = localStorage.getItem('${themeStorageKey}');
    const preference = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    const resolved = preference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference;
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;
  } catch {}
})();`
