'use client'

import { Icon } from '@/components/icons'

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
    {filters && onFilter && <>
      <div className="collection-tabs" role="group" aria-label={filterLabel}>
        {filters.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => onFilter(option.value)}>{option.label}<span>{loading ? '…' : option.count}</span></button>)}
      </div>
      <label className="collection-mobile-filter">{filterLabel}<select value={filter} onChange={event => onFilter(event.target.value)}>{filters.map(option => <option key={option.value} value={option.value}>{option.label}{!loading && option.count !== undefined ? ` (${option.count})` : ''}</option>)}</select></label>
    </>}
    <div className="collection-controls">
      <label className="inline-search"><Icon name="search"/><input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={searchLabel} aria-label={searchLabel}/></label>
      <label className="collection-sort"><span>Sort by</span><select value={sort} onChange={event => onSort(event.target.value)}>{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    </div>
    <div className="collection-summary"><span role="status">{loading ? 'Loading results…' : `${count} of ${total} results`}</span>{onReset && <button type="button" className="text-link" onClick={onReset}>Clear filters</button>}</div>
  </section>
}
