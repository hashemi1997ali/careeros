'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import type { Project } from '@/components/types'

export default function ProjectsPage() { return <AppShell><ProjectsView /></AppShell> }

function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load projects.'); return response.json() as Promise<Project[]> })
      .then(setProjects).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  return <>
    <section className="page-heading"><div><p className="eyebrow">PROOF OF WORK</p><h1>Projects</h1><p>Showcase what you built and the skills you used.</p></div><button className="button button-primary" type="button" disabled title="The create form will be connected next"><Icon name="plus" />Add project</button></section>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {loading ? <div className="project-list content-skeleton"><i /><i /><i /></div> : projects.length ? <section className="project-list">{projects.map((project, index) => <article className="project-card" key={project.id}><div className={`project-art art-${index % 3}`}><Icon name="folder" size={30} /></div><div className="project-copy"><div><h2>{project.title}</h2><time dateTime={project.updatedAtUtc}>{new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(project.updatedAtUtc))}</time></div><p>{project.description}</p><ul>{project.skills.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul></div><div className="project-actions">{project.liveUrl && <a className="button button-ghost" href={project.liveUrl} target="_blank" rel="noreferrer">Open live</a>}{project.repositoryUrl && <a className="text-link" href={project.repositoryUrl} target="_blank" rel="noreferrer">Repository</a>}</div></article>)}</section> : <section className="panel"><EmptyState title="No projects yet" description="Add a project to turn your skills into visible evidence." /></section>}
  </>
}
