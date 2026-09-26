'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/icons'
import { LoadingState } from '@/components/loading-state'
import { PanelTitle } from '@/components/panel-title'
import { useSkillsAppUrl } from '@/components/app-shell'
import { apiFetch } from '@/lib/api-client'
import { buildSkillForgeRoadmapUrl } from '@/lib/skillforge'
import { notify } from '@/lib/notifications'
import type { AiJobAnalysis, ExtractedApplication, JobApplication, JobMatch } from '@/components/types'

const formatDate = (value: string | null | undefined) => value
  ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : '—'

const formatSalary = (value: number | null | undefined) => value === null || value === undefined ? '—' : value.toLocaleString()

const formatApplicationStatus = (status: string | null | undefined) => ({
  Saved: 'Saved',
  Applied: 'Applied',
  HrInterview: 'HR Interview',
  TechnicalInterview: 'Technical Interview',
  Offer: 'Offer',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn'
}[status ?? ''] ?? status ?? '—')

export default function JobAnalyzerPage() {
  const router = useRouter()
  const applicationId = Number(useSearchParams().get('applicationId')) || null
  const [selectedId, setSelectedId] = useState<number | null>(applicationId)
  const [jobText, setJobText] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<AiJobAnalysis | null>(null)
  const [aiPending, setAiPending] = useState(false)
  const [lastAnalyzedContext, setLastAnalyzedContext] = useState<string | null>(null)
  const analysisLock = useRef(false)
  const skillsAppUrl = useSkillsAppUrl()
  const applicationsQuery = useQuery({ queryKey: ['applications'], queryFn: () => apiFetch<JobApplication[]>('/api/job-applications') })
  const applications = applicationsQuery.data ?? []
  const selected = applications.find(item => item.id === selectedId)
  const canRunAi = Boolean(selectedId) || jobText.trim().length > 0
  const currentContextKey = selectedId ? `application:${selectedId}` : `text:${jobText.trim()}`
  const hasAnalyzedCurrentContext = canRunAi && lastAnalyzedContext === currentContextKey

  const analyzeWithAi = useCallback(async () => {
    if (!canRunAi) {
      notify('Select an application or paste a job posting first.', 'info', 'Analysis unavailable')
      return
    }
    if (analysisLock.current) return
    analysisLock.current = true
    setAiPending(true)
    setAiAnalysis(null)
    try {
      const result = await apiFetch<{ analysis: AiJobAnalysis }>('/api/ai/job-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: selectedId, jobText: selectedId ? '' : jobText.trim(), url: null }),
      })
      if (!result.analysis.isJobPosting || !result.analysis.detectedRequirements.length) {
        notify('Analysis was not successful. Please try again.', 'error', 'Analysis unavailable')
        return
      }

      setLastAnalyzedContext(currentContextKey)
      setAiAnalysis(result.analysis)
    } catch {
      // apiFetch publishes the server error through the global notification viewport.
    } finally {
      setAiPending(false)
      analysisLock.current = false
    }
  }, [canRunAi, currentContextKey, jobText, selectedId])

  const selectApplication = (value: string) => {
    setSelectedId(value ? Number(value) : null)
    setJobText('')
    setAiAnalysis(null)
    setLastAnalyzedContext(null)
  }

  const typeJobText = (value: string) => {
    setSelectedId(null)
    setJobText(value)
    setAiAnalysis(null)
    setLastAnalyzedContext(null)
  }

  const createApplicationFromAnalysis = () => {
    if (!aiAnalysis?.extractedApplication) return
    sessionStorage.setItem('careeros:application-draft', JSON.stringify({ ...aiAnalysis.extractedApplication, status: 'Saved' }))
    router.push('/applications?new=1&source=job-analyzer')
  }

  const applicationForResult = selectedId ? selected : aiAnalysis?.extractedApplication

  return <>
    <section className="page-heading"><div><p className="eyebrow">ROLE FIT</p><h1>Job match analyzer</h1><p>Compare a job with your profile.</p></div></section>
    <div className="analyzer-note"><Icon name="sparkles" /><div><strong>AI extraction and skill analysis</strong><p>Choose one saved application or paste one job posting. CareerOS compares the selected context with your current skills, levels and experience.</p></div></div>
    {applicationsQuery.error && <div className="error-banner" role="alert">{applicationsQuery.error.message}</div>}
    <section className="analyzer-grid">
      <article className="panel analyzer-input">
        <PanelTitle icon="briefcase" title="Choose a role or paste a posting" subtitle="Use one source at a time so the analysis stays focused." />
        {applicationsQuery.isPending ? <div className="analyzer-skeleton"><LoadingState label="Loading saved applications"/></div> : <>
          {applications.length ? <><label htmlFor="application-select">Saved application</label><select disabled={aiPending} id="application-select" value={selectedId ?? ''} onChange={event => selectApplication(event.target.value)}><option value="">Select an application</option>{applications.map(application => <option key={application.id} value={application.id}>{application.position} — {application.company}</option>)}</select>{selected && <div className="selected-role-card"><span className={`status-pill ${selected.status}`}>{formatApplicationStatus(selected.status)}</span><h2>{selected.position}</h2><p>{selected.company}</p><div className="requirement-preview"><strong>{selected.requirements.length} requirements</strong>{selected.requirements.length ? <ul>{selected.requirements.slice(0, 8).map(requirement => <li key={requirement.id}><span>{requirement.name}</span><small>{requirement.isRequired ? 'Required' : 'Optional'}</small></li>)}</ul> : <p>This application does not have requirements yet.</p>}</div></div>} </> : <p className="analyzer-help">No saved applications yet. You can still paste a job posting below, or <Link className="text-link" href="/applications?new=1">add an application</Link>.</p>}
          {!selectedId && <><label htmlFor="job-posting-text">Job posting text <span className="field-hint">Use this instead of selecting an application</span></label><textarea disabled={aiPending} id="job-posting-text" className="analyzer-job-text" maxLength={30000} value={jobText} onChange={event => typeJobText(event.target.value)} placeholder="Paste text copied from LinkedIn, Indeed, or another job board..." /></>}
          <div className="analyzer-actions"><button className="button button-dark button-block" type="button" disabled={!canRunAi || aiPending || hasAnalyzedCurrentContext} onClick={analyzeWithAi}>{aiPending ? 'Analyzing with AI…' : 'Analyze with AI'}<Icon name="sparkles" /></button></div>
        </>}
      </article>
      <article className="panel analyzer-result">
        <PanelTitle icon="chart" title="Analysis result" subtitle="Matched skills, gaps, experience context and next learning steps." />
        {aiPending ? <div className="analyzer-skeleton"><LoadingState label="Analyzing your job match"/></div> : aiAnalysis ? <>
          <AnalysisApplicationCard application={applicationForResult ?? null} />
          <div className="ai-analysis-summary"><strong>{aiAnalysis.summary}</strong><p>{aiAnalysis.explanation}</p></div>
          <MatchResult result={{ jobApplicationId: selectedId ?? 0, matchScore: aiAnalysis.matchScore, hasRequirements: true, matchedSkills: aiAnalysis.matchedSkills, missingRequiredSkills: aiAnalysis.missingRequiredSkills, missingOptionalSkills: aiAnalysis.missingOptionalSkills }} roadmapSkills={aiAnalysis.roadmapSkills} skillsAppUrl={skillsAppUrl} />
          {!selectedId && aiAnalysis.extractedApplication && <button className="button button-primary button-block analyzer-create-application" type="button" onClick={createApplicationFromAnalysis}><Icon name="plus" size={16} />Review and create application</button>}
        </> : <AnalysisEmpty />}
      </article>
    </section>
  </>
}

function AnalysisApplicationCard({ application }: { application: ExtractedApplication | JobApplication | null }) {
  if (!application) return null
  return <section className="analysis-application-card"><div><span>Company</span><strong>{application.company || '—'}</strong></div><div><span>Position</span><strong>{application.position || '—'}</strong></div><div><span>Location</span><strong>{application.location || '—'}</strong></div><div><span>Salary</span><strong>{formatSalary(application.salary)}</strong></div>{'status' in application && <div><span>Status</span><strong>{formatApplicationStatus(application.status)}</strong></div>}<div><span>Applied</span><strong>{formatDate(application.appliedAt)}</strong></div><div><span>Interview</span><strong>{formatDate(application.interviewAt)}</strong></div>{application.jobUrl && <a className="text-link" href={application.jobUrl} target="_blank" rel="noreferrer"><Icon name="external" size={13} />Open posting</a>}</section>
}

function AnalysisEmpty() { return <div className="analysis-empty"><div className="score-ring empty"><strong>—</strong><span>Match score</span></div><h2>Run an analysis to see the result</h2><p>Choose one saved application or paste one real job posting. Errors and incomplete inputs are shown as notifications.</p></div> }

function MatchResult({ result, roadmapSkills, skillsAppUrl }: { result: JobMatch; roadmapSkills: string[]; skillsAppUrl: string | null }) { const roadmapUrl = buildSkillForgeRoadmapUrl(skillsAppUrl, roadmapSkills); return <div className="match-result"><div className="score-ring" style={{ background: `conic-gradient(#2fbf98 ${Math.max(0, Math.min(100, result.matchScore)) * 3.6}deg, var(--blue-soft) 0deg)` }}><div><strong>{Math.round(result.matchScore)}%</strong><span>Match score</span></div></div><div className="match-columns"><MatchList title="Matched skills" tone="good" items={result.matchedSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /><MatchList title="Missing required" tone="danger" items={result.missingRequiredSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /><MatchList title="Missing optional" tone="warning" items={result.missingOptionalSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /></div>{roadmapUrl && <a className="button button-ghost button-block match-roadmap-link" href={roadmapUrl} target="_blank" rel="noreferrer"><Icon name="skillforge" size={14} />Build roadmap in SkillForge</a>}</div> }

function MatchList({ title, tone, items, roadmapSkills, skillsAppUrl }: { title: string; tone: 'good' | 'danger' | 'warning'; items: string[]; roadmapSkills: string[]; skillsAppUrl: string | null }) { const isRoadmapSkill = (item: string) => roadmapSkills.some(skill => skill.trim().toLowerCase() === item.trim().toLowerCase()); return <section className={`match-list ${tone}`}><h3>{title}<span>{items.length}</span></h3>{items.length ? <div>{items.map(item => { const itemUrl = isRoadmapSkill(item) ? buildSkillForgeRoadmapUrl(skillsAppUrl, [item]) : null; return <span className="match-skill-item" key={item}>{itemUrl ? <><span>{item}</span><a href={itemUrl} target="_blank" rel="noreferrer" aria-label={`Build a ${item} roadmap in SkillForge`} title="Build roadmap"><Icon name="external" size={13} /></a></> : item}</span> })}</div> : <p>Nothing here.</p>}</section> }
