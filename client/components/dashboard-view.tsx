'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { Icon, type IconName } from '@/components/icons'
import { PanelTitle } from '@/components/panel-title'
import { SkillGraph } from '@/components/skill-graph'
import { useCareerUser, useSkillsAppUrl } from '@/components/app-shell'
import { apiFetch } from '@/lib/api-client'
import { buildSkillForgeRoadmapUrl } from '@/lib/skillforge'
import type { ApplicationStatus, DashboardData, Project, Skill } from '@/components/types'

const pipeline: Array<{ key: ApplicationStatus; label: string; tone: string }> = [
  { key: 'Saved', label: 'Saved', tone: 'slate' }, { key: 'Applied', label: 'Applied', tone: 'blue' },
  { key: 'HrInterview', label: 'HR interview', tone: 'violet' }, { key: 'TechnicalInterview', label: 'Technical', tone: 'amber' },
  { key: 'Offer', label: 'Offer', tone: 'emerald' }, { key: 'Rejected', label: 'Rejected', tone: 'rose' },
]
function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value)) : 'Not applied yet' }
function formatStatus(status: ApplicationStatus) { return status.replace(/([a-z])([A-Z])/g,'$1 $2') }

export function DashboardView() {
  const user = useCareerUser()
  const skillsAppUrl = useSkillsAppUrl()
  const dashboardQuery = useQuery({ queryKey:['dashboard'], queryFn:() => apiFetch<DashboardData>('/api/dashboard') })
  const skillsQuery = useQuery({ queryKey:['skills'], queryFn:() => apiFetch<Skill[]>('/api/skills') })
  const projectsQuery = useQuery({ queryKey:['projects'], queryFn:() => apiFetch<Project[]>('/api/projects') })
  const dashboard = dashboardQuery.data; const skills = skillsQuery.data ?? []; const projects = projectsQuery.data ?? []
  const displayName = user.displayName?.trim()
  const byStatus = dashboard?.applicationsByStatus ?? {} as Record<ApplicationStatus,number>
  const interviews = (byStatus.HrInterview ?? 0) + (byStatus.TechnicalInterview ?? 0)
  const maxGap = Math.max(...(dashboard?.topMissingSkills.map(s => s.count) ?? [1]),1)

  return <>
    <section className="page-heading dashboard-heading"><div><p className="eyebrow">YOUR CAREER DASHBOARD</p><h1>Welcome back{displayName ? `, ${displayName}` : ''} 👋</h1><p>Here&apos;s your career progress at a glance. Keep going.</p></div></section>
    {dashboardQuery.error && <div className="error-banner" role="alert"><span>{dashboardQuery.error.message}</span><button type="button" onClick={() => void dashboardQuery.refetch()}>Try again</button></div>}
    <section className={dashboardQuery.isPending ? 'dashboard-grid is-loading' : 'dashboard-grid'}>
      <Metric icon="briefcase" label="Applications" value={dashboard?.totalApplications ?? 0} detail="Roles you’re tracking" tone="blue"/>
      <Metric icon="user" label="Interviews" value={interviews} detail="HR and technical stages" tone="violet"/>
      <Metric icon="target" label="Offers" value={byStatus.Offer ?? 0} detail="Offers received" tone="amber"/>
      <Metric icon="chart" label="Match score" value={`${Math.round(dashboard?.averageMatchScore ?? 0)}%`} detail="Across applications" tone="teal"/>
      <article className="image-message-card dashboard-card dashboard-card--reminder"><Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill sizes="(min-width: 1280px) 33vw, 100vw" alt="" unoptimized/><Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill sizes="(min-width: 1280px) 33vw, 100vw" alt="" unoptimized/><div><small>CAREEROS REMINDER</small><strong>Consistent progress creates extraordinary results.</strong></div></article>

      <article className="panel pipeline-panel"><div className="panel-heading"><PanelTitle icon="briefcase" title="Application pipeline" subtitle="Track each step of your application journey."/><Link className="text-link" href="/applications">View all</Link></div><div className="pipeline-list">{pipeline.map(stage => <div className="pipeline-stage" key={stage.key}><span>{stage.label}</span><strong>{byStatus[stage.key] ?? 0}</strong><i className={`status-bar ${stage.tone}`}/></div>)}</div></article>
      <article className="panel gap-panel"><PanelTitle icon="chart" title="Top skill gaps" subtitle="Missing skills across your tracked roles."/>{dashboard?.topMissingSkills.length ? <div className="gap-list">{dashboard.topMissingSkills.slice(0,5).map(skill => <div className="gap-row" key={skill.name}><span title={skill.name}>{skill.name}</span><div><i style={{width:`${Math.max((skill.count/maxGap)*100,12)}%`}}/></div><b title={`${skill.count} roles`}>{skill.count}</b></div>)}</div> : <EmptyState title="No skill gaps yet" description="Add job requirements to reveal the skills that appear most often."/>}</article>
      <article className="panel roadmap-panel"><PanelTitle icon="graph" title="Learning roadmap" subtitle="Turn missing skills into a focused plan."/><ul className="check-list"><li><Icon name="check"/>Prioritize recurring gaps</li><li><Icon name="check"/>Build evidence through projects</li><li><Icon name="check"/>Measure progress against roles</li></ul>{(roadmapUrl => roadmapUrl ? <a className="button button-dark button-block" href={roadmapUrl} target="_blank" rel="noreferrer"><Icon name="graph" size={16}/><span>Build roadmap in SkillForge</span><Icon name="arrow"/></a> : <Link className="button button-dark button-block" href="/skills"><span>Review your skills</span><Icon name="arrow"/></Link>)(buildSkillForgeRoadmapUrl(skillsAppUrl, (dashboard?.topMissingSkills ?? []).slice(0,5).map(skill => skill.name)))}</article>

      <article className="panel applications-panel"><div className="panel-heading"><PanelTitle icon="briefcase" title="Recent applications" subtitle="Your latest updated roles."/><Link className="text-link" href="/applications">View all</Link></div><div className="dashboard-list-slot">{dashboard?.recentApplications.length ? <div className="data-table" role="region" aria-label="Recent applications"><table><thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Applied</th></tr></thead><tbody>{dashboard.recentApplications.slice(0,4).map(a => <tr key={a.id}><td><strong>{a.company}</strong></td><td>{a.position}</td><td><span className={`status-pill ${a.status}`}>{formatStatus(a.status)}</span></td><td>{dateLabel(a.appliedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No applications yet" description="Add an application to start tracking your roles." action={<Link className="text-link" href="/applications?new=1">Add an application</Link>}/>}</div></article>
      <article className="panel skill-profile-card"><div className="panel-heading"><PanelTitle icon="sparkles" title="Skill profile" subtitle="Your current proficiency levels."/><Link className="text-link" href="/skills">View all</Link></div><div className="dashboard-list-slot">{skills.length ? <div className="skill-profile-list">{skills.slice(0,4).map(skill => <div key={skill.id}><span>{skill.name}</span><strong className={`level-pill ${skill.level}`}>{skill.level}</strong></div>)}</div> : <EmptyState title="No skills yet" description="Add skills to make your job matching meaningful."/>}</div></article>
      <article className="panel graph-panel"><div className="panel-heading"><PanelTitle icon="graph" title="Evidence graph" subtitle="Projects connected to the skills they demonstrate."/><Link className="text-link" href="/projects">Projects</Link></div><SkillGraph skills={skills} projects={projects}/></article>
    </section>
  </>
}

function Metric({icon,label,value,detail,tone}:{icon:IconName;label:string;value:string|number;detail:string;tone:'blue'|'violet'|'amber'|'teal'}) { return <article className="metric-card dashboard-card"><div className="metric-main"><span className={`soft-icon ${tone}`}><Icon name={icon}/></span><div><p>{label}</p><strong>{value}</strong></div></div><small>{detail}</small></article> }
