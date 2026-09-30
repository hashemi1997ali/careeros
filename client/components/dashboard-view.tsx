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

// Labels come from formatApplicationStatus so badges and the pipeline always read the same.
const pipeline: Array<{ key: ApplicationStatus; tone: string }> = [
  { key: 'Saved', tone: 'slate' },
  { key: 'Applied', tone: 'blue' },
  { key: 'HrInterview', tone: 'violet' },
  { key: 'TechnicalInterview', tone: 'amber' },
  { key: 'Offer', tone: 'emerald' },
  { key: 'Rejected', tone: 'rose' },
  { key: 'Withdrawn', tone: 'muted' },
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
  const byStatus = dashboard?.applicationsByStatus ?? ({} as Partial<Record<ApplicationStatus, number>>)
  const pipelineTotal = pipeline.reduce((sum, stage) => sum + (byStatus[stage.key] ?? 0), 0)
  const interviews = (byStatus.HrInterview ?? 0) + (byStatus.TechnicalInterview ?? 0)
  const gaps = dashboard?.topMissingSkills ?? []
  const maxGap = Math.max(1, ...gaps.map(skill => skill.count))
  const matchScore = Math.round(dashboard?.averageMatchScore ?? 0)
  const roadmapUrl = buildSkillForgeRoadmapUrl(skillsAppUrl, gaps.slice(0, 5).map(skill => skill.name))

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

          <article className="image-message-card dashboard-reminder">
            <Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" loading="eager" unoptimized />
            <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" unoptimized />
            <div>
              <small>Reminder</small>
              <strong>Consistent progress creates extraordinary results.</strong>
            </div>
          </article>

          <article className="panel pipeline-panel">
            <div className="panel-heading">
              <PanelTitle icon="briefcase" title="Application pipeline" subtitle="Roles by current stage." />
              <Link className="text-link" href="/applications">View all<Icon name="arrow" size={15} /></Link>
            </div>
            <div className="pipeline-bar" role="img" aria-label={`${pipelineTotal} applications across ${pipeline.length} stages`}>
              {pipelineTotal ? pipeline.map(stage => (byStatus[stage.key] ?? 0) > 0 && <i key={stage.key} className={`status-bar ${stage.tone}`} style={{ flexGrow: byStatus[stage.key] ?? 0 }} title={`${formatApplicationStatus(stage.key)}: ${byStatus[stage.key]}`} />) : <i className="status-bar empty" />}
            </div>
            <div className="pipeline-list">
              {pipeline.map(stage => (
                <div className="pipeline-stage" key={stage.key} data-empty={(byStatus[stage.key] ?? 0) === 0 ? 'true' : 'false'}>
                  <i className={`status-dot ${stage.tone}`} aria-hidden="true" />
                  <span>{formatApplicationStatus(stage.key)}</span>
                  <strong>{byStatus[stage.key] ?? 0}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel gap-panel">
            <PanelTitle icon="chart" title="Top skill gaps" subtitle="Required skills missing across your roles." />
            {gaps.length ? (
              <ol className="gap-list">
                {gaps.slice(0, 3).map((skill, index) => (
                  <li className="gap-row" key={skill.name} style={{ '--i': index } as React.CSSProperties}>
                    <span title={skill.name}>{skill.name}</span>
                    <div><i style={{ transform: `scaleX(${Math.max(skill.count / maxGap, 0.08)})` }} /></div>
                    <b title={`${skill.count} roles`}>{skill.count}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon="target" title="No skill gaps yet" description="Add job requirements and we will surface the skills that keep coming up." />
            )}
            <div className="gap-panel-action">
              {roadmapUrl ? (
                <a className="button button-ghost button-block" href={roadmapUrl} target="_blank" rel="noreferrer">
                  <Icon name="skillforge" size={16} />Build learning roadmap<Icon name="external" size={14} />
                </a>
              ) : (
                <Link className="button button-ghost button-block" href={gaps.length ? '/skills' : '/applications'}>
                  {gaps.length ? 'Review your skills' : 'Add job requirements'}<Icon name="arrow" size={16} />
                </Link>
              )}
            </div>
          </article>

          <article className="panel applications-panel">
            <div className="panel-heading">
              <PanelTitle icon="briefcase" title="Recent applications" subtitle="Your latest updated roles." />
              <Link className="text-link" href="/applications">View all<Icon name="arrow" size={15} /></Link>
            </div>
            <div className="dashboard-list-slot">
              {dashboard?.recentApplications.length ? (
                <div className="data-table dashboard-applications-table" role="region" aria-label="Recent applications">
                  <table>
                    <caption className="sr-only">Your most recently updated applications</caption>
                    <thead>
                      <tr>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentApplications.slice(0, 3).map(application => (
                        <tr key={application.id}>
                          <td data-label="Company"><span className="cell-stack"><strong title={application.company}>{application.company}</strong><span className="application-role" title={application.position}>{application.position}</span>{application.location && <small title={application.location}>{application.location}</small>}</span></td>
                          <td data-label="Status"><span className={`status-pill ${application.status}`}>{formatApplicationStatus(application.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon="briefcase"
                  title="No applications yet"
                  description="Add a role to start tracking stages, interviews and match scores."
                  action={<Link className="button button-primary" href="/applications?new=1"><Icon name="plus" size={16} />Add an application</Link>}
                />
              )}
            </div>
          </article>

          <article className="panel skill-summary-panel">
            <div className="panel-heading">
              <PanelTitle icon="brain" title="Skill profile" subtitle="Your categories at a glance." />
              <Link className="text-link" href="/skills/graph">Skill Core<Icon name="arrow" size={15} /></Link>
            </div>
            <SkillGraph skills={skills} showLevels={false} showCenterLabel={false} showCaption categoryMode />
          </article>
      </section>
    </>
  )
}
