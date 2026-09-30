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
      <label className="inline-search">
        <Icon name="search" size={18}/>
        <input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={searchLabel} aria-label={searchLabel}/>
        {search && <button type="button" className="inline-search-clear" onClick={() => onSearch('')} aria-label="Clear search"><Icon name="x" size={15}/></button>}
      </label>
      <label className="collection-sort select-field"><span className="sr-only">Sort by</span><Icon name="chart" size={16}/><select value={sort} onChange={event => onSort(event.target.value)} aria-label="Sort by">{sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><Icon name="chevron" size={15} className="select-chevron"/></label>
    </div>
    {filters && onFilter && <div className="filter-chips" role="group" aria-label={filterLabel}>
      {filters.map(option => <button
        key={option.value}
        type="button"
        className="filter-chip"
        aria-pressed={filter === option.value}
        onClick={() => onFilter(option.value)}
      ><span>{option.label}</span>{!loading && option.count !== undefined && <span className="filter-chip-count">{option.count}</span>}</button>)}
    </div>}
    <div className="collection-summary"><span role="status">{loading ? 'Loading results…' : count === total ? `${total} ${total === 1 ? 'item' : 'items'}` : `${count} of ${total} shown`}</span>{onReset && <button type="button" className="text-link" onClick={onReset}><Icon name="x" size={14}/>Clear filters</button>}</div>
  </section>
}
