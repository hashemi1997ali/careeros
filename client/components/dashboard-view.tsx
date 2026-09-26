'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { Icon, type IconName } from '@/components/icons'
import { LoadingState } from '@/components/loading-state'
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
  { key: 'HrInterview', label: 'HR Interview', tone: 'violet' },
  { key: 'TechnicalInterview', label: 'Technical Interview', tone: 'amber' },
  { key: 'Offer', label: 'Offer', tone: 'emerald' },
  { key: 'Rejected', label: 'Rejected', tone: 'rose' },
  { key: 'Withdrawn', label: 'Withdrawn', tone: 'slate' },
]

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
    : 'Not applied yet'
}

export function DashboardView() {
  const user = useCareerUser()
  const skillsAppUrl = useSkillsAppUrl()
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: () => apiFetch<DashboardData>('/api/dashboard') })
  const skillsQuery = useQuery({ queryKey: ['skills'], queryFn: () => apiFetch<Skill[]>('/api/skills') })
  const dashboard = dashboardQuery.data
  const skills = skillsQuery.data ?? []
  const displayName = user.displayName?.trim()
  const byStatus = dashboard?.applicationsByStatus ?? {} as Record<ApplicationStatus, number>
  const maxGap = Math.max(...(dashboard?.topMissingSkills.map(skill => skill.count) ?? [1]), 1)
  const roadmapUrl = buildSkillForgeRoadmapUrl(
    skillsAppUrl,
    (dashboard?.topMissingSkills ?? []).slice(0, 5).map(skill => skill.name),
  )

  return (
    <>
      <section className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">YOUR CAREER DASHBOARD</p>
          <h1>Welcome back{displayName ? `, ${displayName}` : ''}</h1>
          <p>Here&apos;s your career progress at a glance. Keep going.</p>
        </div>
      </section>

      {dashboardQuery.error && (
        <div className="error-banner" role="alert">
          <span>{dashboardQuery.error.message}</span>
          <button type="button" onClick={() => void dashboardQuery.refetch()}>Try again</button>
        </div>
      )}

      {dashboardQuery.isPending ? (
        <LoadingState cards label="Loading dashboard" />
      ) : (
        <section className="dashboard-grid">
          <div className="dashboard-summary">
            <Metric
              icon="briefcase"
              label="Applications"
              value={dashboard?.totalApplications ?? 0}
              detail="Roles you’re tracking"
              tone="blue"
            />
            <Metric
              icon="chart"
              label="Match score"
              value={`${Math.round(dashboard?.averageMatchScore ?? 0)}%`}
              detail="Across applications"
              tone="teal"
            />
          </div>

          <article className="image-message-card dashboard-card--reminder dashboard-reminder">
            <Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" unoptimized />
            <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill sizes="(min-width: 1200px) 30vw, 100vw" alt="" unoptimized />
            <div>
              <small>CAREEROS REMINDER</small>
              <strong>Consistent progress creates extraordinary results.</strong>
            </div>
          </article>

          <article className="panel pipeline-panel">
            <div className="panel-heading">
              <PanelTitle icon="briefcase" title="Application pipeline" subtitle="Roles by current stage." />
              <Link className="text-link" href="/applications">View all</Link>
            </div>
            <div className="pipeline-list">
              {pipeline.map(stage => (
                <div className="pipeline-stage" key={stage.key}>
                  <span>{stage.label}</span>
                  <strong>{byStatus[stage.key] ?? 0}</strong>
                  <i className={`status-bar ${stage.tone}`} />
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
                <div className="data-table" role="region" aria-label="Recent applications" tabIndex={0}>
                  <table role="table">
                    <caption className="sr-only">Your most recently updated applications</caption>
                    <thead>
                      <tr>
                        <th scope="col">Company</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col">Applied</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {dashboard.recentApplications.slice(0, 3).map(application => (
                        <tr role="row" key={application.id}>
                          <td role="cell" data-label="Company"><strong>{application.company}</strong></td>
                          <td role="cell" data-label="Role">{application.position}</td>
                          <td role="cell" data-label="Status">
                            <span className={`status-pill ${application.status}`}>
                              {formatApplicationStatus(application.status)}
                            </span>
                          </td>
                          <td role="cell" data-label="Applied">{dateLabel(application.appliedAt)}</td>
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
            {skillsQuery.isPending ? (
              <LoadingState label="Loading skills" />
            ) : skillsQuery.error ? (
              <div className="error-banner" role="alert">
                <span>{skillsQuery.error.message}</span>
                <button type="button" onClick={() => void skillsQuery.refetch()}>Try again</button>
              </div>
            ) : (
              <SkillGraph skills={skills} showLevels={false} showCenterLabel={false} showCaption={false} />
            )}
          </article>
        </section>
      )}
    </>
  )
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: IconName
  label: string
  value: string | number
  detail: string
  tone: 'blue' | 'violet' | 'amber' | 'teal'
}) {
  return (
    <article className="metric-card dashboard-card">
      <div className="metric-main">
        <span className={`soft-icon ${tone}`}><Icon name={icon} /></span>
        <div><p>{label}</p><strong>{value}</strong></div>
      </div>
      <small>{detail}</small>
    </article>
  )
}
