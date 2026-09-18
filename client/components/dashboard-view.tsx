'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '@/components/empty-state'
import { Icon, type IconName } from '@/components/icons'
import { PanelTitle } from '@/components/panel-title'
import { useCareerUser } from '@/components/app-shell'
import type { ApplicationStatus, DashboardData } from '@/components/types'

const pipeline: Array<{ key: ApplicationStatus; label: string; tone: string }> = [
  { key: 'Saved', label: 'Saved', tone: 'slate' },
  { key: 'Applied', label: 'Applied', tone: 'blue' },
  { key: 'HrInterview', label: 'HR interview', tone: 'violet' },
  { key: 'TechnicalInterview', label: 'Technical', tone: 'amber' },
  { key: 'Offer', label: 'Offer', tone: 'emerald' },
  { key: 'Rejected', label: 'Rejected', tone: 'rose' },
]

function dateLabel(value: string | null) {
  if (!value) return 'Not applied yet'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function formatStatus(status: ApplicationStatus) {
  return status.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function DashboardView() {
  const user = useCareerUser()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/dashboard', { credentials: 'include', cache: 'no-store' })
      if (!response.ok) throw new Error('We could not load your dashboard data.')
      setDashboard((await response.json()) as DashboardData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Something went wrong while loading the dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void loadDashboard())
    return () => window.cancelAnimationFrame(frame)
  }, [loadDashboard])

  const addApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: position.trim(), company: company.trim(), status: 'Saved', requirements: [] }),
      })
      if (!response.ok) throw new Error('We could not save that application. Check both fields and try again.')
      setPosition('')
      setCompany('')
      setShowForm(false)
      await loadDashboard()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const firstName = useMemo(() => user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there', [user])
  const maximumGap = Math.max(...(dashboard?.topMissingSkills.map((skill) => skill.count) ?? [1]), 1)

  return (
    <>
      <section className="page-heading">
        <div><p className="eyebrow">YOUR CAREER DASHBOARD</p><h1>Good morning, {firstName}.</h1><p>Here’s your career progress at a glance. Keep going.</p></div>
        <button className="button button-primary" type="button" onClick={() => setShowForm(true)}><Icon name="plus" />Add application</button>
      </section>

      {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadDashboard()}>Try again</button></div>}

      <section className={loading ? 'metric-grid is-loading' : 'metric-grid'} aria-label="Career totals">
        <MetricCard icon="briefcase" label="Applications" value={dashboard?.totalApplications ?? 0} detail="Roles you’re tracking" tone="blue" />
        <MetricCard icon="sparkles" label="Skills" value={dashboard?.totalSkills ?? 0} detail="Skills in your profile" tone="violet" />
        <MetricCard icon="folder" label="Projects" value={dashboard?.totalProjects ?? 0} detail="Proof of your work" tone="amber" />
        <MetricCard icon="target" label="Average match" value={`${Math.round(dashboard?.averageMatchScore ?? 0)}%`} detail="Across analyzed applications" tone="teal" />
        <article className="image-message-card">
          <Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill sizes="280px" alt="A bright mountain range" unoptimized />
          <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill sizes="280px" alt="A mountain range at night" unoptimized />
          <div><small>CAREEROS REMINDER</small><strong>Consistent progress creates extraordinary results.</strong></div>
        </article>
      </section>

      <section className="overview-grid">
        <article className="panel pipeline-panel">
          <PanelTitle icon="briefcase" title="Application pipeline" subtitle="Track each step of your application journey." />
          <div className="pipeline-list">{pipeline.map((stage) => <div className="pipeline-stage" key={stage.key}><span>{stage.label}</span><strong>{dashboard?.applicationsByStatus?.[stage.key] ?? 0}</strong><i className={`status-bar ${stage.tone}`} /></div>)}</div>
        </article>
        <article className="panel gap-panel">
          <PanelTitle icon="chart" title="Top skill gaps" subtitle="Missing skills across your tracked roles." />
          {dashboard?.topMissingSkills.length ? <div className="gap-list">{dashboard.topMissingSkills.map((skill) => <div className="gap-row" key={skill.name}><span>{skill.name}</span><div><i style={{ width: `${Math.max((skill.count / maximumGap) * 100, 12)}%` }} /></div><b>{skill.count}</b></div>)}</div> : <EmptyState title="No skill gaps yet" description="Add job requirements to reveal the best skills to learn next." />}
        </article>
        <article className="panel roadmap-panel">
          <PanelTitle icon="graph" title="Build your learning roadmap" subtitle="Turn missing skills into a focused plan." />
          <ul className="check-list"><li><Icon name="check" />Personalized next steps</li><li><Icon name="check" />Evidence through projects</li><li><Icon name="check" />Progress you can measure</li></ul>
          <a className="button button-dark button-block" href="/skills">Review your skills <Icon name="arrow" /></a>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="panel applications-panel">
          <div className="panel-heading"><PanelTitle icon="briefcase" title="Recent applications" subtitle="Your latest updated roles." /><a className="text-link" href="/applications">View all</a></div>
          {dashboard?.recentApplications.length ? <div className="data-table" role="region" aria-label="Recent applications" tabIndex={0}><table><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Applied</th></tr></thead><tbody>{dashboard.recentApplications.map((application) => <tr key={application.id}><td><strong>{application.company}</strong></td><td>{application.position}</td><td><span className={`status-pill ${application.status}`}>{formatStatus(application.status)}</span></td><td>{dateLabel(application.appliedAtUtc)}</td></tr>)}</tbody></table></div> : <EmptyState title="Your application list is ready" description="Add the first role you’re considering and it will appear here." action={<button className="text-link as-button" type="button" onClick={() => setShowForm(true)}>Add an application</button>} />}
        </article>
        <article className="panel strength-card"><PanelTitle icon="sparkles" title="Career signal" subtitle="Strong profiles connect claims to evidence." /><div className="signal-orbit" aria-hidden="true"><span>Skills</span><span>Projects</span><strong>CareerOS</strong><span>Roles</span></div><p>Add skills, link them to projects, then compare them with the jobs you want.</p></article>
      </section>

      {showForm && <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" type="button" onClick={() => setShowForm(false)} aria-label="Close application form">×</button><p className="eyebrow">QUICK CAPTURE</p><h2 id="dialog-title">Add an application</h2><p>Save the role now. You can add requirements and details afterward.</p><form onSubmit={addApplication}><label>Position<input required minLength={2} maxLength={150} value={position} onChange={(event) => setPosition(event.target.value)} placeholder="Backend developer" /></label><label>Company<input required minLength={2} maxLength={150} value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Northstar Labs" /></label><div className="dialog-actions"><button className="button button-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Save application'}</button></div></form></section></div>}
    </>
  )
}

function MetricCard({ icon, label, value, detail, tone }: { icon: IconName; label: string; value: string | number; detail: string; tone: string }) {
  return <article className="metric-card"><span className={`soft-icon ${tone}`}><Icon name={icon} /></span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></article>
}
