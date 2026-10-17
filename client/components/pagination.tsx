'use client'

import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/icons'
import type { Paged } from '@/components/types'
import { apiFetch } from '@/lib/api-client'

type PageParams = Record<string, string | string[] | undefined>

/**
 * One page of a server-paged list endpoint (`?page=`). Changing `params` (search, filter, sort) returns to page 1,
 * the previous page stays on screen while the next one loads, and deletes that empty the last page step back.
 * The query key starts with `resource`, so invalidating `[resource]` refreshes every page.
 */
export function usePagedQuery<T>(resource: string, url: string, params: PageParams, pageSize: number) {
  const resetKey = JSON.stringify(params)
  const [state, setState] = useState({ key: resetKey, page: 1 })
  const page = state.key === resetKey ? state.page : 1
  const query = useQuery({
    queryKey: [resource, 'page', params, page, pageSize],
    queryFn: ({ signal }) => {
      const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      for (const [key, value] of Object.entries(params)) for (const item of [value ?? []].flat()) if (item) search.append(key, item)
      return apiFetch<Paged<T>>(`${url}?${search}`, { signal })
    },
    placeholderData: keepPreviousData,
  })
  const total = query.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  useEffect(() => {
    if (!query.data || query.isPlaceholderData || page <= pageCount) return
    const timer = window.setTimeout(() => setState({ key: resetKey, page: pageCount }), 0) // same deferral the pages use for URL-driven state
    return () => window.clearTimeout(timer)
  }, [page, pageCount, query.data, query.isPlaceholderData, resetKey])
  return {
    query,
    items: query.data?.items ?? [],
    total,
    facets: query.data?.facets ?? {},
    page,
    pageCount,
    pageSize,
    setPage: (next: number) => setState({ key: resetKey, page: next }),
  }
}

/** Page numbers with ellipses: 1 … 4 5 6 … 12 */
function pageList(page: number, count: number): Array<number | 'gap'> {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)
  const pages = new Set([1, count, page - 1, page, page + 1].filter(value => value >= 1 && value <= count))
  if (page <= 3) [2, 3, 4].forEach(value => pages.add(value))
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach(value => pages.add(value))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((value, index) => index && value - sorted[index - 1] > 1 ? ['gap' as const, value] : [value])
}

export function Pagination({ page, pageCount, onPage, total, pageSize, label, anchorId }: {
  page: number
  pageCount: number
  onPage: (page: number) => void
  total: number
  pageSize: number
  label: string
  /** Element scrolled back into view when the page changes. */
  anchorId: string
}) {
  if (pageCount <= 1) return null
  const go = (next: number) => {
    onPage(next)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => document.getElementById(anchorId)?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }))
  }
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return <nav className="pagination" aria-label={`${label} pages`}>
    <p className="pagination-range">{from}–{to} of {total}</p>
    <div className="pagination-controls">
      <button type="button" className="pagination-step" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page"><Icon name="arrow" size={15} /></button>
      {pageList(page, pageCount).map((value, index) => value === 'gap'
        ? <span key={`gap-${index}`} className="pagination-gap" aria-hidden="true">…</span>
        : <button key={value} type="button" className="pagination-page" aria-current={value === page ? 'page' : undefined} aria-label={`Page ${value}`} onClick={() => go(value)}>{value}</button>)}
      <button type="button" className="pagination-step" onClick={() => go(page + 1)} disabled={page === pageCount} aria-label="Next page"><Icon name="arrow" size={15} /></button>
    </div>
  </nav>
}
