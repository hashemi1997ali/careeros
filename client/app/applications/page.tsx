'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import type { ApplicationStatus, JobApplication } from '@/components/types'

const filters: Array<{ label: string; value: ApplicationStatus | 'All' }> = [
  { label: 'All', value: 'All' }, { label: 'Saved', value: 'Saved' }, { label: 'Applied', value: 'Applied' },
  { label: 'Interview', value: 'HrInterview' }, { label: 'Offer', value: 'Offer' }, { label: 'Rejected', value: 'Rejected' },
]

function formatStatus(status: ApplicationStatus) { return status.replace(/([a-z])([A-Z])/g, '$1 $2') }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not applied' }

export default function ApplicationsPage() {
  return <AppShell><ApplicationsView /></AppShell>
}

function ApplicationsView() {
  const [items, setItems] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ApplicationStatus | 'All'>('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/job-applications', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load applications.'); return response.json() as Promise<JobApplication[]> })
      .then(setItems).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => items.filter((item) => {
    const statusMatch = filter === 'All' || item.status === filter || (filter === 'HrInterview' && item.status === 'TechnicalInterview')
    const query = search.trim().toLocaleLowerCase()
    return statusMatch && (!query || `${item.company} ${item.position}`.toLocaleLowerCase().includes(query))
  }), [filter, items, search])

  const count = (status: ApplicationStatus) => items.filter((item) => item.status === status).length

  return <>
    <section className="page-heading"><div><p className="eyebrow">OPPORTUNITY TRACKER</p><h1>Job applications</h1><p>Track every role and keep the next action visible.</p></div><a className="button button-primary" href="/dashboard"><Icon name="plus" />Add application</a></section>
    <div className="filter-toolbar"><div className="filter-tabs" role="group" aria-label="Filter applications">{filters.map((item) => <button className={filter === item.value ? 'is-active' : ''} type="button" onClick={() => setFilter(item.value)} key={item.value}>{item.label}<span>{item.value === 'All' ? items.length : item.value === 'HrInterview' ? count('HrInterview') + count('TechnicalInterview') : count(item.value)}</span></button>)}</div><label className="inline-search"><Icon name="search" /><span className="sr-only">Search applications</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company or role" /></label></div>
    <section className="compact-metrics"><article><span className="soft-icon blue"><Icon name="briefcase" /></span><div><strong>{items.length}</strong><p>Total applications</p></div></article><article><span className="soft-icon violet"><Icon name="sparkles" /></span><div><strong>{count('HrInterview') + count('TechnicalInterview')}</strong><p>In interview</p></div></article><article><span className="soft-icon amber"><Icon name="target" /></span><div><strong>{count('Offer')}</strong><p>Offers</p></div></article><article><span className="soft-icon teal"><Icon name="check" /></span><div><strong>{count('Applied')}</strong><p>Applied</p></div></article></section>
    <section className="panel resource-table-panel">
      {error && <div className="error-banner" role="alert">{error}</div>}
      {loading ? <div className="content-skeleton"><i /><i /><i /><i /></div> : visible.length ? <div className="data-table" role="region" aria-label="Applications" tabIndex={0}><table><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Applied date</th><th>Last updated</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.company}</strong></td><td>{item.position}</td><td><span className={`status-pill ${item.status}`}>{formatStatus(item.status)}</span></td><td>{formatDate(item.appliedAtUtc)}</td><td>{formatDate(item.updatedAtUtc)}</td></tr>)}</tbody></table></div> : <EmptyState title="No applications found" description={search || filter !== 'All' ? 'Change the filter or search term.' : 'Your first tracked role will appear here.'} />}
    </section>
  </>
}
