'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/components/icons'
import { LoadingState } from '@/components/loading-state'
import { usePageState } from '@/components/page-state'
import { PanelTitle } from '@/components/panel-title'
import { useSkillsAppUrl } from '@/components/app-shell'
import { apiFetch } from '@/lib/api-client'
import { buildSkillForgeRoadmapUrl } from '@/lib/skillforge'
import { notify } from '@/lib/notifications'
import { formatShortDate } from '@/lib/date'
import { formatApplicationStatus as formatStatusLabel } from '@/lib/application-status'
import type { AiJobAnalysis, ApplicationStatus, ExtractedApplication, JobApplication, JobMatch } from '@/components/types'

const formatDate = (value: string | null | undefined) => formatShortDate(value)

const formatSalary = (value: number | null | undefined) => value === null || value === undefined ? '–' : value.toLocaleString()

const formatApplicationStatus = (status: string | null | undefined) => status ? formatStatusLabel(status as ApplicationStatus) : '–'

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
  const applicationsQuery = useQuery({ queryKey: ['applications'], queryFn: ({ signal }) => apiFetch<JobApplication[]>('/api/job-applications', { signal }) })
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
  const roadmapSkillKeys = new Set(aiAnalysis?.roadmapSkills.map(skill => skill.trim().toLowerCase()))
  const missingRoadmapSkills = aiAnalysis?.missingRequiredSkills.filter(skill => roadmapSkillKeys.has(skill.trim().toLowerCase())) ?? []
  const roadmapUrl = buildSkillForgeRoadmapUrl(skillsAppUrl, missingRoadmapSkills) ?? skillsAppUrl

  const pageState = usePageState([applicationsQuery], 'Loading the analyzer')
  if (pageState) return pageState

  return <>
    <section className="page-heading"><div><p className="eyebrow">ROLE FIT</p><h1>Job match analyzer</h1><p>Compare a job with your profile.</p></div></section>
    <div className="analyzer-note"><Icon name="sparkles" /><div><strong>AI extraction and skill analysis</strong><p>Pick a saved application or paste a posting to compare it with your skills.</p></div></div>
    <section className="analyzer-grid">
      <article className="panel analyzer-input">
        <PanelTitle icon="briefcase" title="Choose a role or paste a posting" subtitle="One source at a time." />
        <>
          {applications.length ? <><label htmlFor="application-select">Saved application</label><select disabled={aiPending} id="application-select" value={selectedId ?? ''} onChange={event => selectApplication(event.target.value)}><option value="">Select an application</option>{applications.map(application => <option key={application.id} value={application.id}>{application.position} · {application.company}</option>)}</select>{selected && <div className="selected-role-card"><span className={`status-pill ${selected.status}`}>{formatApplicationStatus(selected.status)}</span><h2>{selected.position}</h2><p>{selected.company}</p><div className="requirement-preview"><strong>{selected.requirements.length} requirements</strong>{selected.requirements.length ? <ul>{selected.requirements.slice(0, 8).map(requirement => <li key={requirement.id}><span>{requirement.name}</span><small>{requirement.isRequired ? 'Required' : 'Optional'}</small></li>)}{selected.requirements.length > 8 && <li className="requirement-more">+{selected.requirements.length - 8} more skills</li>}</ul> : <p>This application does not have requirements yet.</p>}</div></div>} </> : <p className="analyzer-help">No saved applications yet. You can still paste a job posting below, or <Link className="text-link" href="/applications?new=1">add an application</Link>.</p>}
          {!selectedId && <><label htmlFor="job-posting-text">Job posting text <span className="field-hint">Use this instead of selecting an application</span></label><textarea disabled={aiPending} id="job-posting-text" className="analyzer-job-text" maxLength={30000} value={jobText} onChange={event => typeJobText(event.target.value)} placeholder="Paste text copied from LinkedIn, Indeed, or another job board..." /></>}
          <div className="analyzer-actions"><button className="button button-dark button-block" type="button" disabled={!canRunAi || aiPending || hasAnalyzedCurrentContext} onClick={analyzeWithAi}>{aiPending ? 'Analyzing with AI…' : 'Analyze with AI'}<Icon name="sparkles" /></button></div>
        </>
      </article>
      <article className="panel analyzer-result">
        <PanelTitle icon="chart" title="Analysis result" subtitle="Score, gaps and next steps." />
        {aiPending ? <div className="analyzer-skeleton"><LoadingState label="Analyzing your job match"/></div> : aiAnalysis ? <>
          <div className="analysis-score"><ScoreRing score={aiAnalysis.matchScore} /></div>
          <div className="ai-analysis-summary"><strong>{aiAnalysis.summary}</strong><p>{aiAnalysis.explanation}</p></div>
          <MatchResult result={{ jobApplicationId: selectedId ?? 0, matchScore: aiAnalysis.matchScore, hasRequirements: true, matchedSkills: aiAnalysis.matchedSkills, missingRequiredSkills: aiAnalysis.missingRequiredSkills, missingOptionalSkills: aiAnalysis.missingOptionalSkills }} roadmapSkills={aiAnalysis.roadmapSkills} skillsAppUrl={skillsAppUrl} />
          <AnalysisApplicationCard application={applicationForResult ?? null} />
          <div className="analyzer-result-actions">
            {roadmapUrl && <a className="button button-ghost button-block" href={roadmapUrl} target="_blank" rel="noreferrer"><Icon name="skillforge" size={14} />Build roadmap in SkillForge</a>}
            {!selectedId && aiAnalysis.extractedApplication && <button className="button button-primary button-block" type="button" onClick={createApplicationFromAnalysis}><Icon name="plus" size={16} />Review and create application</button>}
          </div>
        </> : <AnalysisEmpty />}
      </article>
    </section>
  </>
}

function AnalysisApplicationCard({ application }: { application: ExtractedApplication | JobApplication | null }) {
  if (!application) return null
  return <section className="analysis-application-card"><div><span>Company</span><strong>{application.company || '–'}</strong></div><div><span>Position</span><strong>{application.position || '–'}</strong></div><div><span>Location</span><strong>{application.location || '–'}</strong></div><div><span>Salary</span><strong>{formatSalary(application.salary)}</strong></div>{'status' in application && <div><span>Status</span><strong>{formatApplicationStatus(application.status)}</strong></div>}<div><span>Applied</span><strong>{formatDate(application.appliedAt)}</strong></div><div><span>Interview</span><strong>{formatDate(application.interviewAt)}</strong></div>{application.jobUrl && <a className="text-link" href={application.jobUrl} target="_blank" rel="noreferrer"><Icon name="external" size={13} />Open posting</a>}</section>
}

function AnalysisEmpty() { return <div className="analysis-empty"><div className="score-ring empty"><svg viewBox="0 0 120 120" aria-hidden="true"><circle className="score-ring-track" cx="60" cy="60" r="52" /></svg><div><strong>–</strong><span>Match score</span></div></div><h2>Run an analysis to see the result</h2><p>Pick an application or paste a posting, then run the analysis.</p></div> }

function MatchResult({ result, roadmapSkills, skillsAppUrl }: { result: JobMatch; roadmapSkills: string[]; skillsAppUrl: string | null }) { return <div className="match-result"><div className="match-columns"><MatchList title="Matched skills" tone="good" items={result.matchedSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /><MatchList title="Missing required" tone="danger" items={result.missingRequiredSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /><MatchList title="Missing optional" tone="warning" items={result.missingOptionalSkills} roadmapSkills={roadmapSkills} skillsAppUrl={skillsAppUrl} /></div></div> }

function MatchList({ title, tone, items, roadmapSkills, skillsAppUrl }: { title: string; tone: 'good' | 'danger' | 'warning'; items: string[]; roadmapSkills: string[]; skillsAppUrl: string | null }) { const isRoadmapSkill = (item: string) => roadmapSkills.some(skill => skill.trim().toLowerCase() === item.trim().toLowerCase()); return <section className={`match-list ${tone}`}><h3>{title}<span>{items.length}</span></h3>{items.length ? <div>{items.map(item => { const itemUrl = isRoadmapSkill(item) ? buildSkillForgeRoadmapUrl(skillsAppUrl, [item]) : null; return <span className="match-skill-item" key={item}>{itemUrl ? <><span>{item}</span><a href={itemUrl} target="_blank" rel="noreferrer" aria-label={`Build a ${item} roadmap in SkillForge`} title="Build roadmap"><Icon name="external" size={13} /></a></> : item}</span> })}</div> : <p>Nothing here.</p>}</section> }

function ScoreRing({ score }: { score: number }) {
  const value = Math.max(0, Math.min(100, Math.round(score)))
  const circumference = 2 * Math.PI * 52
  const tone = value >= 75 ? 'good' : value >= 45 ? 'warning' : 'danger'
  return <div className={`score-ring score-${tone}`} role="img" aria-label={`Match score ${value}%`}>
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle className="score-ring-track" cx="60" cy="60" r="52" />
      <circle className="score-ring-value" cx="60" cy="60" r="52" strokeDasharray={circumference} style={{ '--ring-offset': circumference * (1 - value / 100), '--ring-length': circumference } as React.CSSProperties} />
    </svg>
    <div><strong>{value}%</strong><span>Match score</span></div>
  </div>
}
