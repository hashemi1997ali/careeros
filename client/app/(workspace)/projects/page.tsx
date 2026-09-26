'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { ResourceToolbar } from '@/components/resource-toolbar'
import { LoadingState } from '@/components/loading-state'
import { Dialog } from '@/components/dialog'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { apiFetch } from '@/lib/api-client'
import type { Project, Skill } from '@/components/types'

const formatProjectPeriod = (startDate: string | null, endDate: string | null) => {
  const format = (value: string) => {
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  }

  if (startDate && endDate) return `${format(startDate)} – ${format(endDate)}`
  if (startDate) return `Started ${format(startDate)}`
  if (endDate) return `Ends ${format(endDate)}`
  return 'Dates not set'
}
const today = new Date().toISOString().slice(0, 10)

export default function ProjectsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const client = useQueryClient()
  const [sort, setSort] = useState('name')
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [open, setOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<Project | null>(null)
  const [viewing, setViewing] = useState<Project | null>(null)
  const [viewingOpen, setViewingOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [repo, setRepo] = useState('')
  const [live, setLive] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [skillIds, setSkillIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch<Project[]>('/api/projects') })
  const skillsQ = useQuery({ queryKey: ['skills'], queryFn: () => apiFetch<Skill[]>('/api/skills') })
  const projects = useMemo(() => projectsQ.data ?? [], [projectsQ.data])
  const skills = useMemo(() => skillsQ.data ?? [], [skillsQ.data])

  function openCreate() {
    setEditing(null)
    setTitle('')
    setDescription('')
    setRepo('')
    setLive('')
    setStartDate('')
    setEndDate('')
    setSkillIds([])
    setError(null)
    setOpen(true)
  }

  useEffect(() => {
    if (params.get('new') !== '1') return
    const timer = window.setTimeout(() => openCreate(), 0)
    return () => window.clearTimeout(timer)
  }, [params])

  useEffect(() => {
    if (open) return
    const timer = window.setTimeout(() => setEditing(null), 300)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (viewingOpen || !viewing) return
    const timer = window.setTimeout(() => setViewing(null), 300)
    return () => window.clearTimeout(timer)
  }, [viewingOpen, viewing])

  function openEdit(project: Project) {
    setEditing(project)
    setTitle(project.title)
    setDescription(project.description)
    setRepo(project.repositoryUrl ?? '')
    setLive(project.liveUrl ?? '')
    setStartDate(project.startDate ?? '')
    setEndDate(project.endDate ?? '')
    setSkillIds(project.skills.map(skill => skill.id))
    setError(null)
    setOpen(true)
  }

  function openDetails(project: Project) {
    setViewing(project)
    setViewingOpen(true)
  }

  function closeDetails() {
    setViewingOpen(false)
  }

  function close() {
    setOpen(false)
    setError(null)
    if (params.get('new') === '1') router.replace('/projects')
  }

  const save = useMutation({
    mutationFn: async ({ id, payload }: {
      id: number | null
      payload: {
        title: string
        description: string
        repositoryUrl: string | null
        liveUrl: string | null
        startDate: string | null
        endDate: string | null
        skillIds: number[]
      }
    }) => id === null
      ? apiFetch<Project>('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : apiFetch<void>(`/api/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    onSuccess: (created, { id, payload }) => {
      client.setQueryData<Project[]>(['projects'], (previous = []) => id === null && created
        ? [created, ...previous]
        : previous.map(project => project.id === id
          ? { ...project, ...payload, skills: payload.skillIds.map(skillId => skills.find(skill => skill.id === skillId)).filter((skill): skill is Skill => Boolean(skill)) }
          : project))
      close()
      void Promise.all([client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })])
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const del = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/projects/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      setListError(null)
      await client.cancelQueries({ queryKey: ['projects'] })
      const previous = client.getQueryData<Project[]>(['projects'])
      client.setQueryData<Project[]>(['projects'], (current = []) => current.filter(project => project.id !== id))
      return { previous }
    },
    onError: (cause: Error, _id, context) => {
      if (context?.previous) client.setQueryData(['projects'], context.previous)
      setListError(cause.message)
    },
    onSettled: () => { void Promise.all([client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]) },
  })

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter(project => !term || `${project.title} ${project.description}`.toLowerCase().includes(term)).sort((a, b) => sort === 'skills' ? b.skills.length - a.skills.length || a.title.localeCompare(b.title) : sort === 'started' ? (b.startDate ?? '').localeCompare(a.startDate ?? '') || a.title.localeCompare(b.title) : a.title.localeCompare(b.title))
  }, [projects, search, sort])

  const toggle = (id: number) => setSkillIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (title.trim().length < 2 || description.trim().length < 10) return
    if (endDate && !startDate) {
      setError('Choose a start date before setting an end date.')
      return
    }
    if (startDate && endDate && endDate < startDate) {
      setError('End date cannot be earlier than start date.')
      return
    }
    save.mutate({
      id: editing?.id ?? null,
      payload: { title: title.trim(), description: description.trim(), repositoryUrl: repo.trim() || null, liveUrl: live.trim() || null, startDate: startDate || null, endDate: endDate || null, skillIds },
    })
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">PROOF OF WORK</p><h1>Projects</h1><p>Show what you built and the skills behind it.</p></div><button className="button button-primary" type="button" onClick={openCreate}><Icon name="plus" />Add project</button></section>
    <ResourceToolbar search={search} onSearch={setSearch} searchLabel="Search projects" sort={sort} onSort={setSort} sortOptions={[{value:'name',label:'Name A–Z'},{value:'started',label:'Recently started'},{value:'skills',label:'Most linked skills'}]} count={visible.length} total={projects.length} loading={projectsQ.isPending} onReset={search ? () => setSearch('') : undefined}/>
    {(projectsQ.error || listError) && <div className="error-banner" role="alert">{listError ?? projectsQ.error?.message}</div>}
    {projectsQ.isPending ? <LoadingState cards label="Loading projects"/> : visible.length ? (
      <section className="project-list">
        {visible.map((project, index) => (
          <article className="project-card" key={project.id}>
            <div className={`project-art project-preview art-${index % 3}`}>
              {project.liveUrl && <iframe className="project-live-preview" src={project.liveUrl} title={`${project.title} live preview`} loading="lazy" scrolling="no" tabIndex={-1} />}
              {!project.liveUrl && <Icon name="folder" size={32} />}
              {project.liveUrl && <a className="project-live-link" href={project.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.title} live site`} title="Open live site"><Icon name="external" size={17} /></a>}
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="project-information">
              <div className="project-copy">
                <h2>{project.title}</h2>
                <small className="project-period">{formatProjectPeriod(project.startDate, project.endDate)}</small>
                <p>{project.description}</p>
                <ul>{project.skills.map(skill => <li key={skill.id}>{skill.name}</li>)}</ul>
              </div>
              <div className="project-actions">
                <div className="project-link-row">
                  <button className="danger" type="button" onClick={() => window.confirm(`Delete ${project.title}?`) && del.mutate(project.id)} aria-label={`Delete ${project.title}`} title={`Delete ${project.title}`}><Icon name="trash" size={17} /></button>
                  <button className="project-edit-action" type="button" onClick={() => openEdit(project)} aria-label={`Edit ${project.title}`} title={`Edit ${project.title}`}><Icon name="edit" size={17} /></button>
                  <button className="project-edit-action" type="button" onClick={() => openDetails(project)} aria-label={`View details for ${project.title}`} title="View project details"><Icon name="eye" size={17} /></button>
                  {(project.liveUrl || project.repositoryUrl) && <a className="project-edit-action" href={project.liveUrl ?? project.repositoryUrl ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open a link for ${project.title}`} title="Open project link"><Icon name="share" size={17} /></a>}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    ) : <section className="panel"><EmptyState title="No projects found" description={search ? 'Change your search term.' : 'Add a project to turn your skills into visible evidence.'} /></section>}
    <Dialog
      open={open}
      onClose={close}
      eyebrow={editing ? 'UPDATE EVIDENCE' : 'NEW EVIDENCE'}
      title={editing ? `Edit ${editing.title}` : 'Add a project'}
      description="Describe what you built and link the skills this project demonstrates."
      footer={<div className="dialog-actions"><button className="button button-ghost" type="button" onClick={close}>Cancel</button><button className="button button-primary" type="submit" form="project-dialog-form" disabled={save.isPending}>{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add project'}</button></div>}
    >
      <form id="project-dialog-form" className="dialog-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label>Project title<input required minLength={2} maxLength={150} value={title} onChange={event => setTitle(event.target.value)} placeholder="CareerOS" /></label>
        <label>Description<textarea required minLength={10} maxLength={4000} value={description} onChange={event => setDescription(event.target.value)} placeholder="What did you build?" /></label>
        <div className="form-grid"><label>Repository URL<input type="url" value={repo} onChange={event => setRepo(event.target.value)} placeholder="https://github.com/..." /></label><label>Live URL<input type="url" value={live} onChange={event => setLive(event.target.value)} placeholder="https://..." /></label><label>Start date <span className="field-hint">Optional</span><input type="date" max={today} value={startDate} onChange={event => { setStartDate(event.target.value); if (!event.target.value) setEndDate('') }} /></label><label>End date <span className="field-hint">Optional</span><input type="date" max={today} min={startDate || undefined} disabled={!startDate} value={endDate} onChange={event => setEndDate(event.target.value)} /></label></div>
        <fieldset className="skill-picker"><legend>Skills demonstrated</legend>{skills.length ? <div>{skills.map(skill => <label key={skill.id} className={skillIds.includes(skill.id) ? 'is-selected' : ''}><input type="checkbox" checked={skillIds.includes(skill.id)} onChange={() => toggle(skill.id)} /><span>{skill.name}</span></label>)}</div> : <p>Add skills first, then connect them to your project.</p>}</fieldset>
      </form>
    </Dialog>
    {viewing && <Dialog
      open={viewingOpen}
      onClose={closeDetails}
      wide
      eyebrow="PROJECT DETAILS"
      title={viewing.title}
      description="Review the project description, timeline and linked skills."
      footer={<div className="dialog-actions"><button className="button button-ghost" type="button" onClick={closeDetails}>Close</button><button className="button button-primary" type="button" onClick={() => { const project = viewing; closeDetails(); window.setTimeout(() => { setViewing(null); openEdit(project) }, 300) }}><Icon name="edit" size={16} />Edit project</button></div>}
    >
      <div className="application-details">
        <div className="application-details-grid project-detail-meta">
          <div><span>Period</span><strong>{formatProjectPeriod(viewing.startDate, viewing.endDate)}</strong></div>
          <div><span>Linked skills</span><strong>{viewing.skills.length}</strong></div>
        </div>
        <section><h3>Description</h3><p>{viewing.description}</p></section>
        <section>
          <h3>Skills demonstrated</h3>
          {viewing.skills.length ? <ul className="application-requirements">{viewing.skills.map(skill => <li key={skill.id}><span>{skill.name}</span></li>)}</ul> : <p>No skills linked to this project.</p>}
        </section>
        {(viewing.repositoryUrl || viewing.liveUrl) && <section className="project-detail-links">
          <h3>Project links</h3>
          {viewing.liveUrl && <a className="application-detail-link" href={viewing.liveUrl} target="_blank" rel="noopener noreferrer"><Icon name="external" size={15} />Open live project</a>}
          {viewing.repositoryUrl && <a className="application-detail-link" href={viewing.repositoryUrl} target="_blank" rel="noopener noreferrer"><Icon name="graph" size={15} />Open repository</a>}
        </section>}
      </div>
    </Dialog>}
  </>
}
