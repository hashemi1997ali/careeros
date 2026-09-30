'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { usePageState } from '@/components/page-state'
import { PanelTitle } from '@/components/panel-title'
import { SkillGraph } from '@/components/skill-graph'
import { useCareerUser, useSkillsAppUrl } from '@/components/app-shell'
import { apiFetch } from '@/lib/api-client'
import { formatApplicationStatus } from '@/lib/application-status'
import { buildSkillForgeRoadmapUrl } from '@/lib/skillforge'
import type { ApplicationStatus, DashboardData, Skill } from '@/components/types'

const pipeline: Array<{ key: ApplicationStatus; label: string; tone: string }> = [
  { key: 'Saved', label: 'Saved', tone: 'slate' },
  { key: 'Applied', label: 'Applied', tone: 'blue' },
  { key: 'HrInterview', label: 'HR interview', tone: 'violet' },
  { key: 'TechnicalInterview', label: 'Technical', tone: 'amber' },
  { key: 'Offer', label: 'Offer', tone: 'emerald' },
  { key: 'Rejected', label: 'Rejected', tone: 'rose' },
  { key: 'Withdrawn', label: 'Withdrawn', tone: 'muted' },
]

function greeting(date = new Date()) {
  const hour = date.getHours()
  return hour < 5 ? 'Working late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

export function DashboardView() {
  const user = useCareerUser()
  const skillsAppUrl = useSkillsAppUrl()
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: ({ signal }) => apiFetch<DashboardData>('/api/dashboard', { signal }) })
  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: ({ signal }) => apiFetch<Skill[]>('/api/skills', { signal }) })
  const dashboard = dashboardQuery.data
  const skills = skillsQuery.data ?? []
  const firstName = user.displayName?.trim().split(/\s+/)[0]
  const byStatus = dashboard?.applicationsByStatus ?? {} as Record<ApplicationStatus, number>
  const pipelineTotal = pipeline.reduce((sum, stage) => sum + (byStatus[stage.key] ?? 0), 0)
  const interviews = (byStatus.HrInterview ?? 0) + (byStatus.TechnicalInterview ?? 0)
  const matchScore = Math.round(dashboard?.averageMatchScore ?? 0)
  const maxGap = Math.max(...(dashboard?.topMissingSkills.map(skill => skill.count) ?? [1]), 1)
  const roadmapUrl = buildSkillForgeRoadmapUrl(
    skillsAppUrl,
    (dashboard?.topMissingSkills ?? []).slice(0, 5).map(skill => skill.name),
  )

  const pageState = usePageState([dashboardQuery, skillsQuery], 'Loading your dashboard')
  if (pageState) return pageState

  return (
    <>
      <section className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Your career dashboard</p>
          <h1><span suppressHydrationWarning>{greeting()}</span>{firstName ? `, ${firstName}` : ''}</h1>
          <p>Here is where every role, skill and project stands today.</p>
        </div>
      </section>

      <section className="dashboard-grid">
          <article className="panel dashboard-summary">
            <div className="summary-figure">
              <span className="summary-label">Tracked roles</span>
              <strong className="metric-value">{dashboard?.totalApplications ?? 0}</strong>
              <span className="summary-detail">{interviews} in interviews · {byStatus.Offer ?? 0} offers</span>
            </div>
            <div className="summary-figure">
              <span className="summary-label">Average match</span>
              <strong className="metric-value">{matchScore}<small>%</small></strong>
              <div className="summary-meter" role="img" aria-label={`Average match ${matchScore}%`}>
                <i style={{ transform: `scaleX(${Math.min(100, Math.max(0, matchScore)) / 100})` }} />
              </div>
            </div>
            <div className="summary-figure">
              <span className="summary-label">Skills on file</span>
              <strong className="metric-value">{skillsQuery.isPending ? '…' : skills.length}</strong>
              <Link className="text-link" href="/skills">Manage skills<Icon name="arrow" size={15} /></Link>
            </div>
          </article>

          <article className="image-message-card dashboard-card--reminder dashboard-reminder">
            <Image className="theme-image theme-image-light" src="/images/landing/alpine-hero.webp" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" unoptimized />
            <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" unoptimized />
            <div>
              <small>CAREEROS REMINDER</small>
              <strong>Consistent progress creates extraordinary results.</strong>
            </div>
          </article>

          <article className="panel pipeline-panel">
            <div className="panel-heading">
              <PanelTitle icon="briefcase" title="Application pipeline" subtitle="Roles by current stage." />
              <Link className="text-link" href="/applications">View all<Icon name="arrow" size={15} /></Link>
            </div>
            <div className="pipeline-bar" role="img" aria-label={`${pipelineTotal} applications across ${pipeline.length} stages`}>
              {pipelineTotal ? pipeline.map(stage => (byStatus[stage.key] ?? 0) > 0 && <i key={stage.key} className={`status-bar ${stage.tone}`} style={{ flexGrow: byStatus[stage.key] ?? 0 }} title={`${stage.label}: ${byStatus[stage.key]}`} />) : <i className="status-bar empty" />}
            </div>
            <div className="pipeline-list">
              {pipeline.map(stage => (
                <div className="pipeline-stage" key={stage.key} data-empty={(byStatus[stage.key] ?? 0) === 0 ? 'true' : 'false'}>
                  <i className={`status-dot ${stage.tone}`} aria-hidden="true" />
                  <span>{stage.label}</span>
                  <strong>{byStatus[stage.key] ?? 0}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel gap-panel">
            <PanelTitle icon="chart" title="Top skill gaps" subtitle="Required skills missing across your roles." />
            {dashboard?.topMissingSkills.length ? (
              <div className="gap-list">
                {dashboard.topMissingSkills.slice(0, 3).map(skill => (
                  <div className="gap-row" key={skill.name}>
                    <span title={skill.name}>{skill.name}</span>
                    <div><i style={{ width: `${Math.max((skill.count / maxGap) * 100, 12)}%` }} /></div>
                    <b title={`${skill.count} roles`}>{skill.count}</b>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No skill gaps yet"
                description="Add job requirements to see which skills recur across your roles."
              />
            )}
            <div className="gap-panel-action">
              {roadmapUrl ? (
                <a className="text-link" href={roadmapUrl} target="_blank" rel="noreferrer">
                  <Icon name="skillforge" size={16} />
                  <span>Build learning roadmap</span>
                  <Icon name="arrow" />
                </a>
              ) : (
                <Link className="text-link" href={dashboard?.topMissingSkills.length ? '/skills' : '/applications'}>
                  <span>{dashboard?.topMissingSkills.length ? 'Review your skills' : 'Add job requirements'}</span>
                  <Icon name="arrow" />
                </Link>
              )}
            </div>
          </article>

          <article className="panel applications-panel">
            <div className="panel-heading">
              <PanelTitle icon="briefcase" title="Recent applications" subtitle="Your latest updated roles." />
              <Link className="text-link" href="/applications">View all</Link>
            </div>
            <div className="dashboard-list-slot">
              {dashboard?.recentApplications.length ? (
                <div className="data-table dashboard-applications-table" role="region" aria-label="Recent applications">
                  <table role="table">
                    <caption className="sr-only">Your most recently updated applications</caption>
                    <thead>
                      <tr>
                        <th scope="col">Company</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col">Location</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {dashboard.recentApplications.slice(0, 3).map(application => (
                        <tr role="row" key={application.id}>
                          <td role="cell" data-label="Company"><strong>{application.company}</strong></td>
                          <td role="cell" data-label="Role"><span>{application.position}</span></td>
                          <td role="cell" data-label="Status">
                            <span className={`status-pill ${application.status}`}>
                              {formatApplicationStatus(application.status)}
                            </span>
                          </td>
                          <td role="cell" data-label="Location"><span>{application.location || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No applications yet"
                  description="Add an application to start tracking your roles."
                  action={<Link className="text-link" href="/applications?new=1">Add an application</Link>}
                />
              )}
            </div>
          </article>

          <article className="panel skill-summary-panel">
            <div className="panel-heading">
              <PanelTitle icon="brain" title="Skill profile" subtitle="Your strongest skills at a glance." />
              <Link className="text-link" href="/skills/graph">View all</Link>
            </div>
            <SkillGraph skills={skills} showLevels={false} showCenterLabel={false} showCaption categoryMode />
          </article>
      </section>
    </>
  )
}
