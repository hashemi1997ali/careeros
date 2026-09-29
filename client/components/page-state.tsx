'use client'

import { useState, type ReactNode } from 'react'
import { BrandMark } from '@/components/brand'
import { Icon, type IconName } from '@/components/icons'
import { isApiError } from '@/lib/api-client'

/* One loading screen and one error screen for every workspace page.
   Pages hand their queries to `usePageState`; while anything is loading the whole
   page shows a loader, and any failure shows a single full-page message. */

export function PageLoader({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <section className="page-state page-state-loading" role="status" aria-live="polite" aria-label={label}>
      <div className="page-state-mark" aria-hidden="true">
        <span className="page-state-orbit" />
        <BrandMark className="page-state-brand" />
      </div>
      <p className="page-state-label">{label}</p>
      <span className="page-state-progress" aria-hidden="true"><i /></span>
    </section>
  )
}

type Tone = 'offline' | 'session' | 'error'
const copy: Record<Tone, { icon: IconName; title: string; description: string }> = {
  offline: { icon: 'serverOff', title: 'Can’t connect to the server', description: 'CareerOS couldn’t reach its server. Your data is safe. Check your connection and reload.' },
  session: { icon: 'user', title: 'Your session expired', description: 'Sign in again to keep working where you left off.' },
  error: { icon: 'alert', title: 'This page didn’t load', description: 'Something went wrong while loading your data. Reloading usually fixes it.' },
}

export function toneFor(error: unknown): Tone {
  if (!isApiError(error)) return 'error'
  if (error.kind === 'unavailable') return 'offline'
  if (error.kind === 'unauthorized') return 'session'
  return 'error'
}

export function PageError({ error, onRetry, retrying = false }: { error: unknown; onRetry: () => unknown; retrying?: boolean }) {
  const tone = toneFor(error)
  const { icon, title, description } = copy[tone]
  const [pressed, setPressed] = useState(false)
  const busy = retrying || pressed

  const retry = async () => {
    setPressed(true)
    try { await onRetry() } finally { setPressed(false) }
  }

  return (
    <section className={`page-state page-state-error page-state-${tone}`} role="alert" aria-live="assertive">
      <span className="page-state-icon" aria-hidden="true"><Icon name={icon} size={30} /></span>
      <h1 className="page-state-title">{title}</h1>
      <p className="page-state-description">{description}</p>
      {tone === 'session'
        ? <a className="button button-primary page-state-action" href="/auth/login?returnTo=/dashboard"><Icon name="arrow" size={17} />Sign in again</a>
        : <button className="button button-primary page-state-action" type="button" onClick={retry} disabled={busy} aria-busy={busy}>
            <Icon name="refresh" size={17} className={busy ? 'page-state-spin' : undefined} />
            {busy ? 'Reconnecting…' : 'Reload'}
          </button>}
      {tone === 'error' && isApiError(error) && error.message && <small className="page-state-detail">{error.message}</small>}
    </section>
  )
}

interface QueryLike {
  isPending: boolean
  isError: boolean
  isFetching: boolean
  error: unknown
  refetch: () => Promise<unknown>
}

/**
 * Returns the full-page loader/error for a set of queries, or `null` once every query has data.
 * Errors win over loading so an offline server is reported immediately.
 */
export function usePageState(queries: QueryLike[], loadingLabel?: string): ReactNode | null {
  const failed = queries.find(query => query.isError)
  if (failed) {
    const retry = () => Promise.all(queries.filter(query => query.isError).map(query => query.refetch()))
    return <PageError error={failed.error} onRetry={retry} retrying={queries.some(query => query.isError && query.isFetching)} />
  }
  if (queries.some(query => query.isPending)) return <PageLoader label={loadingLabel} />
  return null
}
