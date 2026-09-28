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
    <div className="collection-controls">
      <label className="inline-search"><Icon name="search"/><input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={searchLabel} aria-label={searchLabel}/></label>
      {filters && onFilter && <label className="collection-filter"><span>{filterLabel}</span><select value={filter} onChange={event => onFilter(event.target.value)}>{filters.map(option => <option key={option.value} value={option.value}>{option.label}{!loading && option.count !== undefined ? ` (${option.count})` : ''}</option>)}</select></label>}
      <label className="collection-sort"><span>Sort by</span><select value={sort} onChange={event => onSort(event.target.value)}>{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    </div>
    <div className="collection-summary"><span role="status">{loading ? 'Loading results…' : `${count} of ${total} results`}</span>{onReset && <button type="button" className="text-link" onClick={onReset}>Clear filters</button>}</div>
  </section>
}
