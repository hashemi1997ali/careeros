'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog } from '@/components/dialog'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { apiFetch } from '@/lib/api-client'
import type { Skill, SkillLevel } from '@/components/types'

const levels: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced']
const today = new Date().toISOString().slice(0, 10)
const formatExperience = (startDate: string | null) => {
  if (!startDate) return 'Experience not set'
  const start = new Date(`${startDate}T00:00:00`)
  if (Number.isNaN(start.getTime())) return 'Experience not set'
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth()
  if (now.getDate() < start.getDate()) months -= 1
  if (months < 1) return 'Less than 1 month'
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} experience`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? '' : 's'} experience`
}

export default function SkillsPage() {
  const router = useRouter()
  const params = useSearchParams()
  const client = useQueryClient()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [open, setOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState<Skill | null>(null)
  const [name, setName] = useState('')
  const [cat, setCat] = useState('')
  const [level, setLevel] = useState<SkillLevel>('Beginner')
  const [startDate, setStartDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const q = useQuery({ queryKey: ['skills'], queryFn: () => apiFetch<Skill[]>('/api/skills') })
  const skills = useMemo(() => q.data ?? [], [q.data])

  function openCreate() {
    setEditing(null); setName(''); setCat(''); setLevel('Beginner'); setStartDate(''); setError(null); setOpen(true)
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

  function openEdit(skill: Skill) {
    setEditing(skill); setName(skill.name); setCat(skill.category); setLevel(skill.level); setStartDate(skill.startDate ?? ''); setError(null); setOpen(true)
  }

  function close() {
    setOpen(false); setError(null)
    if (params.get('new') === '1') router.replace('/skills')
  }

  const save = useMutation({
    mutationFn: async ({ id, payload }: { id: number | null; payload: Pick<Skill, 'name' | 'category' | 'level' | 'startDate'> }) => id === null
      ? apiFetch<Skill>('/api/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : apiFetch<void>(`/api/skills/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),
    onSuccess: (created, { id, payload }) => {
      client.setQueryData<Skill[]>(['skills'], (previous = []) => id === null && created ? [created, ...previous] : previous.map(skill => skill.id === id ? { ...skill, ...payload } : skill))
      close()
      void Promise.all([client.invalidateQueries({ queryKey: ['skills'] }), client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })])
    },
    onError: (cause: Error) => setError(cause.message),
  })

  const del = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/skills/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => { setListError(null); await client.cancelQueries({ queryKey: ['skills'] }); const previous = client.getQueryData<Skill[]>(['skills']); client.setQueryData<Skill[]>(['skills'], (current = []) => current.filter(skill => skill.id !== id)); return { previous } },
    onError: (cause: Error, _id, context) => { if (context?.previous) client.setQueryData(['skills'], context.previous); setListError(cause.message) },
    onSettled: () => { void Promise.all([client.invalidateQueries({ queryKey: ['skills'] }), client.invalidateQueries({ queryKey: ['projects'] }), client.invalidateQueries({ queryKey: ['dashboard'] })]) },
  })

  const categories = useMemo(() => ['All', ...Array.from(new Set(skills.map(skill => skill.category)))], [skills])
  const visible = useMemo(() => { const term = search.trim().toLowerCase(); return skills.filter(skill => (category === 'All' || skill.category === category) && (!term || `${skill.name} ${skill.category}`.toLowerCase().includes(term))) }, [category, search, skills])
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (name.trim().length < 2 || cat.trim().length < 2) return; save.mutate({ id: editing?.id ?? null, payload: { name: name.trim(), category: cat.trim(), level, startDate: startDate || null } }) }

  return <>
    <section className="page-heading"><div><p className="eyebrow">YOUR CAPABILITIES</p><h1>Skills</h1><p>Track what you know and connect it to real evidence.</p></div><button className="button button-primary" type="button" onClick={openCreate}><Icon name="plus" />Add skill</button></section>
    <div className="resource-toolbar"><div className="filter-tabs">{categories.map(item => <button className={item === category ? 'is-active' : ''} type="button" onClick={() => setCategory(item)} key={item}>{item}<span>{item === 'All' ? skills.length : skills.filter(skill => skill.category === item).length}</span></button>)}</div><label className="inline-search"><Icon name="search" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search skills" /></label></div>
    {(q.error || listError) && <div className="error-banner" role="alert">{listError ?? q.error?.message}</div>}
    {q.isPending ? <div className="card-grid content-skeleton"><i /><i /><i /></div> : visible.length ? <section className="card-grid">{visible.map(skill => <article className="skill-card" key={skill.id}><div className="skill-card-head"><span className="skill-monogram">{skill.name.slice(0, 2).toUpperCase()}</span><div className="card-actions"><button className="danger" type="button" onClick={() => window.confirm(`Delete ${skill.name}?`) && del.mutate(skill.id)} aria-label={`Delete ${skill.name}`} title={`Delete ${skill.name}`}><Icon name="trash" size={17} /></button><button type="button" onClick={() => openEdit(skill)} aria-label={`Edit ${skill.name}`} title={`Edit ${skill.name}`}><Icon name="edit" size={17} /></button></div></div><p>{skill.category}</p><h2>{skill.name}</h2><span className={`level-pill ${skill.level}`}>{skill.level}</span><small className="skill-experience">{formatExperience(skill.startDate)}</small>{skill.projects.length ? <div className="skill-projects"><span>Projects</span><ul>{skill.projects.map(project => <li key={project.id}>{project.title}</li>)}</ul></div> : <small className="skill-projects-empty">No linked projects yet</small>}</article>)}</section> : <section className="panel"><EmptyState title="No skills found" description={search || category !== 'All' ? 'Change the filter or search term.' : 'Add skills to build your profile and improve job matching.'} /></section>}
    <Dialog
      open={open}
      onClose={close}
      eyebrow={editing ? 'UPDATE SKILL' : 'NEW CAPABILITY'}
      title={editing ? `Edit ${editing.name}` : 'Add a skill'}
      description="Track your proficiency, start date and project evidence."
      footer={<div className="dialog-actions"><button className="button button-ghost" type="button" onClick={close}>Cancel</button><button className="button button-primary" type="submit" form="skill-dialog-form" disabled={save.isPending}>{save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add skill'}</button></div>}
    >
      <form id="skill-dialog-form" className="dialog-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <label>Skill name<input required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Docker" /></label>
        <label>Category<input required minLength={2} maxLength={50} value={cat} onChange={event => setCat(event.target.value)} placeholder="DevOps" /></label>
        <label>Proficiency<select value={level} onChange={event => setLevel(event.target.value as SkillLevel)}>{levels.map(item => <option key={item}>{item}</option>)}</select></label>
        <label>Start date<input type="date" max={today} value={startDate} onChange={event => setStartDate(event.target.value)} /></label>
      </form>
    </Dialog>
  </>
}
