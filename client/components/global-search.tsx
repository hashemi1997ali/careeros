'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api-client'
import { Icon } from '@/components/icons'
import { ModalCloseButton, ModalShell } from '@/components/modal-shell'
import type { JobApplication, Project, Skill } from '@/components/types'

type Results = { applications: JobApplication[]; skills: Skill[]; projects: Project[] }
const empty: Results = { applications: [], skills: [], projects: [] }

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results>(empty)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()) }, [open])
  useEffect(() => {
    if (!open) return
    const value = query.trim()
    if (value.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const search = encodeURIComponent(value)
      try {
        const [applications, skills, projects] = await Promise.all([
          apiFetch<JobApplication[]>(`/api/job-applications?search=${search}`, { signal: controller.signal }),
          apiFetch<Skill[]>(`/api/skills?search=${search}`, { signal: controller.signal }),
          apiFetch<Project[]>(`/api/projects?search=${search}`, { signal: controller.signal }),
        ])
        setResults({ applications, skills, projects })
      } catch { if (!controller.signal.aborted) setResults(empty) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }, 220)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [open, query])
  const count = results.applications.length + results.skills.length + results.projects.length
  return <ModalShell open={open} onClose={onClose} surfaceClassName="command-panel" ariaLabel="Search CareerOS">
      <div className="command-input"><Icon name="search"/><input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setResults(empty); setLoading(e.target.value.trim().length >= 2) }} placeholder="Search applications, skills and projects..."/><ModalCloseButton className="command-close" onClose={onClose}/></div>
      <div className="command-results">
        {query.trim().length < 2 ? <div className="command-hint"><Icon name="search" size={26}/><strong>Search across your workspace</strong><span>Type at least two characters.</span></div> : loading ? <div className="command-hint"><span className="spinner"/>Searching…</div> : count === 0 ? <div className="command-hint">No matching items found.</div> : <>
          {results.applications.length > 0 && <Group title="Applications">{results.applications.slice(0,5).map(item => <Link key={item.id} href={`/applications?search=${encodeURIComponent(item.company)}`} onClick={onClose}><span className="search-result-icon"><Icon name="briefcase"/></span><span><strong>{item.position}</strong><small>{item.company}</small></span><Icon name="arrow" size={16}/></Link>)}</Group>}
          {results.skills.length > 0 && <Group title="Skills">{results.skills.slice(0,5).map(item => <Link key={item.id} href={`/skills?search=${encodeURIComponent(item.name)}`} onClick={onClose}><span className="search-result-icon"><Icon name="sparkles"/></span><span><strong>{item.name}</strong><small>{item.category} · {item.level}</small></span><Icon name="arrow" size={16}/></Link>)}</Group>}
          {results.projects.length > 0 && <Group title="Projects">{results.projects.slice(0,5).map(item => <Link key={item.id} href={`/projects?search=${encodeURIComponent(item.title)}`} onClick={onClose}><span className="search-result-icon"><Icon name="folder"/></span><span><strong>{item.title}</strong><small>{item.skills.length} linked skills</small></span><Icon name="arrow" size={16}/></Link>)}</Group>}
        </>}
      </div>
  </ModalShell>
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="search-group"><p>{title}</p><div>{children}</div></div>
}
