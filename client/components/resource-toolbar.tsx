'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/icons'
import { CountBadge } from '@/components/badge'

type Option = { value: string; label: string; count?: number }

export function ResourceToolbar({ search, onSearch, searchLabel, filters, filter, onFilter, filterLabel = 'Category', sort, onSort, sortOptions, count, total, loading, onReset }: {
  search: string
  onSearch: (value: string) => void
  searchLabel: string
  filters?: Option[]
  filter?: string
  onFilter?: (value: string) => void
  filterLabel?: string
  sort: string
  onSort: (value: string) => void
  sortOptions: Option[]
  count: number
  total: number
  loading?: boolean
  onReset?: () => void
}) {
  return <section className="collection-toolbar" aria-label="Filter and sort results">
    <div className="collection-controls">
      <label className="inline-search">
        <Icon name="search" size={18}/>
        <input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={searchLabel} aria-label={searchLabel}/>
        {search && <button type="button" className="inline-search-clear" onClick={() => onSearch('')} aria-label="Clear search"><Icon name="x" size={15}/></button>}
      </label>
      <label className="collection-sort select-field"><span className="sr-only">Sort by</span><Icon name="chart" size={16}/><select value={sort} onChange={event => onSort(event.target.value)} aria-label="Sort by">{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron" size={15} className="select-chevron"/></label>
    </div>
    {filters && onFilter && <FilterStrip label={filterLabel} filters={filters} filter={filter} onFilter={onFilter} loading={loading}/>}
    <div className="collection-summary"><span role="status">{loading ? 'Loading results…' : count === total ? `${total} ${total === 1 ? 'item' : 'items'}` : `${count} of ${total} shown`}</span>{onReset && <button type="button" className="text-link" onClick={onReset}><Icon name="x" size={14}/>Clear filters</button>}</div>
  </section>
}

/* Filter chips always stay on one row. When they overflow, the row scrolls sideways,
   its edges fade, and (on pointer devices) arrow buttons page through it. */
function FilterStrip({ label, filters, filter, onFilter, loading }: { label: string; filters: Option[]; filter?: string; onFilter: (value: string) => void; loading?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const update = () => setEdges({ start: element.scrollLeft > 4, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 4 })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [filters.length])

  // Keep the selected chip visible, e.g. after a reset or a filter chosen elsewhere.
  useEffect(() => {
    const element = scroller.current
    const active = element?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!element || !active) return
    const left = active.offsetLeft - element.offsetLeft
    if (left < element.scrollLeft || left + active.offsetWidth > element.scrollLeft + element.clientWidth) element.scrollTo({ left: left - 40, behavior: 'smooth' })
  }, [filter])

  const page = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.7, behavior: 'smooth' })

  // Mouse drag scrolls the row like a touch swipe; a drag never counts as a chip click.
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || !scroller.current) return
    drag.current = { x: event.clientX, left: scroller.current.scrollLeft, moved: false }
  }
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current, element = scroller.current
    if (!state || !element) return
    const distance = event.clientX - state.x
    if (!state.moved && Math.abs(distance) < 5) return
    if (!state.moved) { state.moved = true; setDragging(true); element.setPointerCapture(event.pointerId) }
    element.scrollLeft = state.left - distance
  }
  const endDrag = () => { drag.current = null; setDragging(false) }

  return <div className="filter-strip" data-fade-start={edges.start} data-fade-end={edges.end}>
    {edges.start && <button type="button" className="filter-scroll" data-side="start" onClick={() => page(-1)} aria-label="Show previous filters" tabIndex={-1}><Icon name="arrow" size={15}/></button>}
    <div ref={scroller} className="filter-chips" role="group" aria-label={label} data-dragging={dragging} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {filters.map(option => <button
        key={option.value}
        type="button"
        className="chip"
        aria-pressed={filter === option.value}
        onClick={() => onFilter(option.value)}
      ><span>{option.label}</span>{!loading && option.count !== undefined && <CountBadge>{option.count}</CountBadge>}</button>)}
    </div>
    {edges.end && <button type="button" className="filter-scroll" data-side="end" onClick={() => page(1)} aria-label="Show more filters" tabIndex={-1}><Icon name="arrow" size={15}/></button>}
  </div>
}
