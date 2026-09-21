'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '@/components/empty-state'
import { Icon } from '@/components/icons'
import { PanelTitle } from '@/components/panel-title'
import { apiFetch } from '@/lib/api-client'
import type { JobApplication, JobMatch } from '@/components/types'

export default function JobAnalyzerPage() {
  const applicationId = Number(useSearchParams().get('applicationId')) || null
  const [selectedId, setSelectedId] = useState<number | null>(applicationId)
  const [analysisId, setAnalysisId] = useState<number | null>(applicationId)
  const applicationsQuery = useQuery({ queryKey:['applications'], queryFn:() => apiFetch<JobApplication[]>('/api/job-applications') })
  const matchQuery = useQuery({ queryKey:['job-match',analysisId], queryFn:() => apiFetch<JobMatch>(`/api/job-applications/${analysisId}/match`), enabled:analysisId !== null, retry:false })
  const applications=applicationsQuery.data??[]
  const selected=applications.find(item=>item.id===selectedId)

  return <>
    <section className="page-heading"><div><p className="eyebrow">ROLE FIT</p><h1>Job match analyzer</h1><p>Compare a tracked role&apos;s requirements with the skills in your profile.</p></div><Link className="button button-primary" href="/applications?new=1"><Icon name="plus"/>Add role</Link></section>
    <div className="analyzer-note"><Icon name="sparkles"/><div><strong>AI extraction is intentionally not faked.</strong><p>The backend already calculates deterministic match scores from saved requirements. When an AI extraction endpoint is added, this screen can turn pasted descriptions into structured requirements first.</p></div></div>
    <section className="analyzer-grid">
      <article className="panel analyzer-input"><PanelTitle icon="briefcase" title="Choose a tracked role" subtitle="The match uses the requirements saved with that application."/>{applicationsQuery.isPending?<div className="content-skeleton analyzer-skeleton"><i/><i/><i/></div>:applications.length?<><label htmlFor="application-select">Application</label><select id="application-select" value={selectedId??''} onChange={e=>{const v=e.target.value;setSelectedId(v?Number(v):null);setAnalysisId(null)}}><option value="">Select an application</option>{applications.map(a=><option key={a.id} value={a.id}>{a.position} — {a.company}</option>)}</select>{selected&&<div className="selected-role-card"><span className={`status-pill ${selected.status}`}>{selected.status}</span><h2>{selected.position}</h2><p>{selected.company}</p><div className="requirement-preview"><strong>{selected.requirements.length} requirements</strong>{selected.requirements.length?<ul>{selected.requirements.slice(0,8).map(r=><li key={r.id}><span>{r.name}</span><small>{r.isRequired?'Required':'Optional'} · weight {r.weight}</small></li>)}</ul>:<p>This application does not have requirements yet.</p>}</div></div>}<button className="button button-dark button-block" type="button" disabled={!selectedId||matchQuery.isFetching} onClick={()=>setAnalysisId(selectedId)}>{matchQuery.isFetching?'Analyzing…':'Analyze match'}<Icon name="arrow"/></button></>:<EmptyState title="No tracked applications" description="Add a role first, then save its requirements to calculate a match." action={<Link className="text-link" href="/applications?new=1">Add an application</Link>}/>}</article>
      <article className="panel analyzer-result"><PanelTitle icon="chart" title="Analysis result" subtitle="A deterministic comparison between your skills and the role requirements."/>{matchQuery.error?<div className="analysis-empty"><span className="soft-icon amber"><Icon name="target"/></span><h2>We could not calculate this match.</h2><p>{matchQuery.error.message}</p></div>:matchQuery.data?<MatchResult result={matchQuery.data}/>:<div className="analysis-empty"><div className="score-ring empty"><strong>—</strong><span>Match score</span></div><h2>Select a role to begin</h2><p>You&apos;ll see matched skills, missing required skills and optional gaps here.</p></div>}</article>
    </section>
  </>
}

function MatchResult({result}:{result:JobMatch}) { return <div className="match-result"><div className="score-ring" style={{background:`conic-gradient(#2fbf98 ${Math.max(0,Math.min(100,result.matchScore))*3.6}deg, var(--blue-soft) 0deg)`}}><div><strong>{Math.round(result.matchScore)}%</strong><span>Match score</span></div></div><div className="match-columns"><MatchList title="Matched skills" tone="good" items={result.matchedSkills}/><MatchList title="Missing required" tone="danger" items={result.missingRequiredSkills}/><MatchList title="Missing optional" tone="warning" items={result.missingOptionalSkills}/></div></div> }
function MatchList({title,tone,items}:{title:string;tone:'good'|'danger'|'warning';items:string[]}) { return <section className={`match-list ${tone}`}><h3>{title}<span>{items.length}</span></h3>{items.length?<div>{items.map(item=><span key={item}>{item}</span>)}</div>:<p>Nothing here.</p>}</section> }
