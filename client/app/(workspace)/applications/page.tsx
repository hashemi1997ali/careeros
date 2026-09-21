'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog } from '@/components/dialog'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { apiFetch } from '@/lib/api-client'
import type { ApplicationStatus, JobApplication, JobRequirement } from '@/components/types'

const statuses: ApplicationStatus[] = ['Saved', 'Applied', 'HrInterview', 'TechnicalInterview', 'Offer', 'Rejected', 'Withdrawn']
const filters: Array<{ label: string; value: ApplicationStatus | 'All' }> = [
  { label: 'All', value: 'All' }, { label: 'Saved', value: 'Saved' },
  { label: 'Applied', value: 'Applied' }, { label: 'Interview', value: 'HrInterview' },
  { label: 'Offer', value: 'Offer' }, { label: 'Rejected', value: 'Rejected' },
  { label: 'Withdrawn', value: 'Withdrawn' },
]
const formatStatus = (status: ApplicationStatus) => status.replace(/([a-z])([A-Z])/g, '$1 $2')
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—'
const toLocalInput = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const toUtc = (value: string) => value ? new Date(value).toISOString() : null

type RequirementDraft = { key: number; name: string; isRequired: boolean; weight: number }
type ApplicationDraft = {
  company: string; position: string; jobUrl: string; location: string; salary: string
  status: ApplicationStatus; appliedAtUtc: string; interviewAtUtc: string
  notes: string; jobDescription: string; requirements: RequirementDraft[]
}
type ApplicationInput = Omit<ApplicationDraft, 'salary' | 'appliedAtUtc' | 'interviewAtUtc' | 'requirements' | 'jobUrl' | 'location' | 'notes' | 'jobDescription'> & {
  salary: number | null; appliedAtUtc: string | null; interviewAtUtc: string | null
  jobUrl: string | null; location: string | null; notes: string | null; jobDescription: string | null
  requirements: Array<Pick<JobRequirement, 'name' | 'isRequired' | 'weight'>>
}
const emptyDraft = (): ApplicationDraft => ({ company: '', position: '', jobUrl: '', location: '', salary: '', status: 'Saved', appliedAtUtc: '', interviewAtUtc: '', notes: '', jobDescription: '', requirements: [] })
const draftFrom = (item: JobApplication): ApplicationDraft => ({
  company: item.company, position: item.position, jobUrl: item.jobUrl ?? '', location: item.location ?? '',
  salary: item.salary?.toString() ?? '', status: item.status, appliedAtUtc: toLocalInput(item.appliedAtUtc),
  interviewAtUtc: toLocalInput(item.interviewAtUtc), notes: item.notes ?? '', jobDescription: item.jobDescription ?? '',
  requirements: item.requirements.map((requirement) => ({ key: requirement.id, name: requirement.name, isRequired: requirement.isRequired, weight: requirement.weight })),
})
const inputFrom = (draft: ApplicationDraft): ApplicationInput => ({
  company: draft.company.trim(), position: draft.position.trim(), status: draft.status,
  jobUrl: draft.jobUrl.trim() || null, location: draft.location.trim() || null,
  salary: draft.salary.trim() ? Number(draft.salary) : null,
  appliedAtUtc: toUtc(draft.appliedAtUtc), interviewAtUtc: toUtc(draft.interviewAtUtc),
  notes: draft.notes.trim() || null, jobDescription: draft.jobDescription.trim() || null,
  requirements: draft.requirements.map(({ name, isRequired, weight }) => ({ name: name.trim(), isRequired, weight })),
})

export default function ApplicationsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const client = useQueryClient()
  const nextRequirementKey = useRef(-1)
  const [filter, setFilter] = useState<ApplicationStatus | 'All'>('All')
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [open, setOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<JobApplication | null>(null)
  const [viewing, setViewing] = useState<JobApplication | null>(null)
  const [draft, setDraft] = useState<ApplicationDraft>(emptyDraft)
  const [error, setError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('new') !== '1') return
    const timer = window.setTimeout(() => setOpen(true), 0)
    return () => window.clearTimeout(timer)
  }, [params])

  const query = useQuery({ queryKey: ['applications'], queryFn: () => apiFetch<JobApplication[]>('/api/job-applications') })
  const items = useMemo(() => query.data ?? [], [query.data])
  const count = (status: ApplicationStatus) => items.filter((item) => item.status === status).length
  const visible = useMemo(() => items.filter((item) => {
    const statusMatches = filter === 'All' || item.status === filter || (filter === 'HrInterview' && item.status === 'TechnicalInterview')
    const text = search.trim().toLowerCase()
    return statusMatches && (!text || `${item.company} ${item.position} ${item.location ?? ''}`.toLowerCase().includes(text))
  }), [filter, items, search])

  const close = () => { setOpen(false); setEditing(null); setError(null); if (params.get('new') === '1') router.replace('/applications') }
  const openCreate = () => { setEditing(null); setDraft(emptyDraft()); setError(null); setOpen(true) }
  const openEdit = (item: JobApplication) => { setEditing(item); setDraft(draftFrom(item)); setError(null); setOpen(true) }
  const openView = (item: JobApplication) => { setViewing(item); setDraft(draftFrom(item)) }
  const closeView = () => setViewing(null)
  const update = <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const updateRequirement = (key: number, field: 'name' | 'isRequired' | 'weight', value: string | boolean | number) => {
    setDraft((current) => ({ ...current, requirements: current.requirements.map((requirement) => requirement.key === key ? { ...requirement, [field]: value } : requirement) }))
  }

  const save = useMutation({
    mutationFn: async ({ id, input }: { id: number | null; input: ApplicationInput }) => {
      if (id === null) return apiFetch<JobApplication>('/api/job-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      await apiFetch<void>(`/api/job-applications/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      return null
    },
    onSuccess: (created, { id, input }) => {
      client.setQueryData<JobApplication[]>(['applications'], (previous = []) => id === null && created
        ? [created, ...previous]
        : previous.map((item) => item.id === id ? {
          ...item, ...input, updatedAtUtc: new Date().toISOString(),
          requirements: input.requirements.map((requirement, index) => ({ ...requirement, id: item.requirements[index]?.id ?? -(index + 1) })),
        } : item))
      setListError(null)
      close()
      void Promise.all([client.invalidateQueries({ queryKey: ['applications'] }), client.invalidateQueries({ queryKey: ['dashboard'] }), client.invalidateQueries({ queryKey: ['job-match'] })])
    },
    onError: (cause: Error) => setError(cause.message),
  })
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) => apiFetch<void>(`/api/job-applications/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }),
    onMutate: async ({ id, status }) => {
      setListError(null)
      await client.cancelQueries({ queryKey: ['applications'] })
      const previous = client.getQueryData<JobApplication[]>(['applications'])
      client.setQueryData<JobApplication[]>(['applications'], (current = []) => current.map((item) => item.id === id ? { ...item, status, updatedAtUtc: new Date().toISOString() } : item))
      return { previous }
    },
    onError: (cause: Error, _variables, context) => { if (context?.previous) client.setQueryData(['applications'], context.previous); setListError(cause.message) },
    onSettled: () => { void Promise.all([client.invalidateQueries({ queryKey: ['applications'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]) },
  })
  const remove = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/job-applications/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      setListError(null)
      await client.cancelQueries({ queryKey: ['applications'] })
      const previous = client.getQueryData<JobApplication[]>(['applications'])
      client.setQueryData<JobApplication[]>(['applications'], (current = []) => current.filter((item) => item.id !== id))
      return { previous }
    },
    onError: (cause: Error, _id, context) => { if (context?.previous) client.setQueryData(['applications'], context.previous); setListError(cause.message) },
    onSettled: () => { void Promise.all([client.invalidateQueries({ queryKey: ['applications'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]) },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (draft.requirements.some((requirement) => requirement.name.trim().length < 2)) { setError('Each requirement needs a name of at least two characters.'); return }
    save.mutate({ id: editing?.id ?? null, input: inputFrom(draft) })
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">OPPORTUNITY TRACKER</p><h1>Job applications</h1><p>Track every role and keep the next action visible.</p></div><button className="button button-primary" type="button" onClick={openCreate}><Icon name="plus"/>Add application</button></section>
    <div className="filter-toolbar"><div className="filter-tabs">{filters.map((option) => <button className={filter === option.value ? 'is-active' : ''} type="button" onClick={() => setFilter(option.value)} key={option.value}>{option.label}<span>{option.value === 'All' ? items.length : option.value === 'HrInterview' ? count('HrInterview') + count('TechnicalInterview') : count(option.value)}</span></button>)}</div><label className="inline-search"><Icon name="search"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role or location" aria-label="Search applications"/></label></div>
    <section className="compact-metrics"><article><span className="soft-icon blue"><Icon name="briefcase"/></span><div><strong>{items.length}</strong><p>Total applications</p></div></article><article><span className="soft-icon violet"><Icon name="user"/></span><div><strong>{count('HrInterview') + count('TechnicalInterview')}</strong><p>In interview</p></div></article><article><span className="soft-icon amber"><Icon name="target"/></span><div><strong>{count('Offer')}</strong><p>Offers</p></div></article><article><span className="soft-icon teal"><Icon name="check"/></span><div><strong>{count('Applied')}</strong><p>Applied</p></div></article></section>
    {(query.error || listError) && <div className="error-banner" role="alert">{listError ?? query.error?.message}</div>}
    <section className="panel resource-table-panel">{query.isPending ? <div className="content-skeleton"><i/><i/><i/><i/></div> : visible.length ? <div className="data-table application-table" role="region" aria-label="Applications"><table><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Location</th><th>Salary</th><th>Applied</th><th>Interview</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.company}</strong></td><td><span className="application-role">{item.position}</span>{item.jobUrl && <a className="application-job-link" href={item.jobUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open job posting for ${item.position}`}><Icon name="external" size={14}/></a>}</td><td><select className={`status-select ${item.status}`} value={item.status} disabled={changeStatus.isPending && changeStatus.variables?.id === item.id} onChange={(event) => changeStatus.mutate({ id: item.id, status: event.target.value as ApplicationStatus })} aria-label={`Status of ${item.position} at ${item.company}`}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></td><td>{item.location || '—'}</td><td>{item.salary === null ? '—' : item.salary.toLocaleString()}</td><td>{formatDate(item.appliedAtUtc)}</td><td>{formatDate(item.interviewAtUtc)}</td><td className="row-actions"><button className="icon-action danger" type="button" onClick={() => window.confirm(`Delete ${item.position} at ${item.company}?`) && remove.mutate(item.id)} aria-label={`Delete ${item.position} at ${item.company}`} title="Delete application"><Icon name="trash" size={17}/></button><button className="icon-action" type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.position} at ${item.company}`} title="Edit application"><Icon name="edit" size={17}/></button><button className="icon-action" type="button" onClick={() => openView(item)} aria-label={`View all details for ${item.position} at ${item.company}`} title="View all details"><Icon name="eye" size={17}/></button></td></tr>)}</tbody></table></div> : <EmptyState title="No applications found" description={search || filter !== 'All' ? 'Change the filter or search term.' : 'Your first tracked role will appear here.'}/>}</section>
    <Dialog key={editing ? `edit-${editing.id}` : 'create'} open={open} onClose={close} wide eyebrow={editing ? 'APPLICATION DETAILS' : 'NEW OPPORTUNITY'} title={editing ? `Edit ${editing.position}` : 'Add an application'} description="Keep the role, timeline and requirements together so matching stays accurate.">
      <form className="dialog-form application-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-grid"><label>Company<input required minLength={2} maxLength={150} value={draft.company} onChange={(event) => update('company', event.target.value)} placeholder="Northstar Labs"/></label><label>Position<input required minLength={2} maxLength={150} value={draft.position} onChange={(event) => update('position', event.target.value)} placeholder="Backend developer"/></label></div>
        <div className="form-grid"><label>Location<input maxLength={150} value={draft.location} onChange={(event) => update('location', event.target.value)} placeholder="Remote · Berlin"/></label><label>Salary<input type="number" min="0" max="10000000" step="0.01" value={draft.salary} onChange={(event) => update('salary', event.target.value)} placeholder="Optional"/></label></div>
        <div className="form-grid"><label>Status<select value={draft.status} onChange={(event) => update('status', event.target.value as ApplicationStatus)}>{statuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select></label><label>Job posting URL<input type="url" maxLength={2048} value={draft.jobUrl} onChange={(event) => update('jobUrl', event.target.value)} placeholder="https://..."/></label></div>
        <div className="form-grid"><label>Applied at<input type="datetime-local" value={draft.appliedAtUtc} onChange={(event) => update('appliedAtUtc', event.target.value)}/></label><label>Interview at<input type="datetime-local" value={draft.interviewAtUtc} onChange={(event) => update('interviewAtUtc', event.target.value)}/></label></div>
        <label>Job description<textarea maxLength={30000} value={draft.jobDescription} onChange={(event) => update('jobDescription', event.target.value)} placeholder="Paste the job description here..."/></label>
        <label>Notes<textarea maxLength={4000} value={draft.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Contacts, follow-up dates, next steps..."/></label>
        <fieldset className="requirements-editor"><legend>Required skills and criteria</legend><p>Weights from 1 to 5 determine how much each skill affects the match score.</p>{draft.requirements.map((requirement) => <div className="requirement-row" key={requirement.key}><label>Skill or criterion<input required minLength={2} maxLength={100} value={requirement.name} onChange={(event) => updateRequirement(requirement.key, 'name', event.target.value)} placeholder="ASP.NET Core"/></label><label>Weight<select value={requirement.weight} onChange={(event) => updateRequirement(requirement.key, 'weight', Number(event.target.value))}>{[1, 2, 3, 4, 5].map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></label><label className="requirement-required"><input type="checkbox" checked={requirement.isRequired} onChange={(event) => updateRequirement(requirement.key, 'isRequired', event.target.checked)}/>Required</label><button className="icon-action danger" type="button" aria-label={`Remove ${requirement.name || 'requirement'}`} onClick={() => update('requirements', draft.requirements.filter((entry) => entry.key !== requirement.key))}><Icon name="trash" size={17}/></button></div>)}<button className="button button-ghost requirement-add" type="button" onClick={() => update('requirements', [...draft.requirements, { key: nextRequirementKey.current--, name: '', isRequired: true, weight: 1 }])}><Icon name="plus" size={17}/>Add requirement</button></fieldset>
        {editing && <p className="application-meta">Created {formatDate(editing.createdAtUtc)} · Last updated {formatDate(editing.updatedAtUtc)}</p>}
        <div className="dialog-actions">{editing && <Link className="button button-ghost" href={`/job-analyzer?applicationId=${editing.id}`}>Analyze match</Link>}<button className="button button-ghost" type="button" onClick={close}>Cancel</button><button className="button button-primary" type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add application'}</button></div>
      </form>
    </Dialog>
    {viewing && <Dialog open onClose={closeView} wide eyebrow="APPLICATION DETAILS" title={`${viewing.position} at ${viewing.company}`} description="Review the complete application record.">
      <div className="application-details">
        <div className="application-details-grid">
          <div><span>Company</span><strong>{viewing.company}</strong></div>
          <div><span>Position</span><strong>{viewing.position}</strong></div>
          <div><span>Status</span><strong>{formatStatus(viewing.status)}</strong></div>
          <div><span>Location</span><strong>{viewing.location || '—'}</strong></div>
          <div><span>Salary</span><strong>{viewing.salary === null ? '—' : viewing.salary.toLocaleString()}</strong></div>
          <div><span>Applied</span><strong>{formatDate(viewing.appliedAtUtc)}</strong></div>
          <div><span>Interview</span><strong>{formatDate(viewing.interviewAtUtc)}</strong></div>
          <div><span>Created</span><strong>{formatDate(viewing.createdAtUtc)}</strong></div>
        </div>
        {viewing.jobUrl && <a className="application-detail-link" href={viewing.jobUrl} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15}/>Open job posting</a>}
        {viewing.jobDescription && <section><h3>Job description</h3><p>{viewing.jobDescription}</p></section>}
        {viewing.notes && <section><h3>Notes</h3><p>{viewing.notes}</p></section>}
        <section><h3>Required skills and criteria</h3>{viewing.requirements.length ? <ul className="application-requirements">{viewing.requirements.map((requirement) => <li key={requirement.id}><span>{requirement.name}</span><small>{requirement.isRequired ? 'Required' : 'Optional'} · Weight {requirement.weight}</small></li>)}</ul> : <p>No requirements added.</p>}</section>
        <div className="dialog-actions"><button className="button button-ghost" type="button" onClick={closeView}>Close</button><button className="button button-primary" type="button" onClick={() => { closeView(); openEdit(viewing) }}><Icon name="edit" size={16}/>Edit application</button></div>
      </div>
    </Dialog>}
  </>
}
