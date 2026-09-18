'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import type { Skill } from '@/components/types'

const levelPercent = { Beginner: 28, Intermediate: 56, Advanced: 78, Expert: 94 }

export default function SkillsPage() { return <AppShell><SkillsView /></AppShell> }

function SkillsView() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/skills', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { if (!response.ok) throw new Error('Could not load skills.'); return response.json() as Promise<Skill[]> })
      .then(setSkills).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => ['All', ...Array.from(new Set(skills.map((skill) => skill.category)))], [skills])
  const visible = category === 'All' ? skills : skills.filter((skill) => skill.category === category)

  return <>
    <section className="page-heading"><div><p className="eyebrow">YOUR CAPABILITIES</p><h1>Skills</h1><p>Track what you know and connect it to evidence.</p></div><button className="button button-primary" type="button" disabled title="The create form will be connected next"><Icon name="plus" />Add skill</button></section>
    <div className="filter-tabs standalone" role="group" aria-label="Filter skills by category">{categories.map((item) => <button className={item === category ? 'is-active' : ''} type="button" onClick={() => setCategory(item)} key={item}>{item}<span>{item === 'All' ? skills.length : skills.filter((skill) => skill.category === item).length}</span></button>)}</div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {loading ? <div className="card-grid content-skeleton"><i /><i /><i /></div> : visible.length ? <section className="card-grid">{visible.map((skill) => <article className="skill-card" key={skill.id}><span className="skill-monogram">{skill.name.slice(0, 2).toUpperCase()}</span><p>{skill.category}</p><h2>{skill.name}</h2><span className={`level-pill ${skill.level}`}>{skill.level}</span><div className="level-bar"><i style={{ width: `${levelPercent[skill.level]}%` }} /></div><footer><span><Icon name="chart" size={17} />{levelPercent[skill.level]}% strength</span><span>Ready to link</span></footer></article>)}</section> : <section className="panel"><EmptyState title="No skills yet" description="Add skills to build your profile and improve job matching." /></section>}
  </>
}
