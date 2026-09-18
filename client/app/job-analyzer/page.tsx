'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Icon } from '@/components/icons'
import { PanelTitle } from '@/components/panel-title'

export default function JobAnalyzerPage() { return <AppShell><JobAnalyzerView /></AppShell> }

function JobAnalyzerView() {
  const [description, setDescription] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  return <>
    <section className="page-heading"><div><p className="eyebrow">ROLE FIT</p><h1>AI job analyzer</h1><p>Compare a job description with the skills and evidence in your profile.</p></div></section>
    <section className="analyzer-grid">
      <article className="panel analyzer-input"><PanelTitle icon="briefcase" title="Job description" subtitle="Paste the full role description for the best result." /><label htmlFor="job-description">Job description</label><textarea id="job-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Paste the job description here…" /><div className="analyzer-actions"><span>{description.length.toLocaleString()} characters</span><button className="button button-dark" type="button" disabled={description.trim().length < 80} onClick={() => setShowGuide(true)}>Analyze description <Icon name="arrow" /></button></div></article>
      <article className="panel analyzer-result"><PanelTitle icon="chart" title="Analysis result" subtitle="Your match score and skill gaps will appear here." />{showGuide ? <div className="analyzer-guide"><span className="soft-icon teal"><Icon name="check" /></span><h2>The analysis flow is ready for integration.</h2><p>The current backend calculates a match for a saved application with structured requirements. Save this role first, then connect this screen to that endpoint.</p><a className="button button-primary" href="/applications">Go to applications <Icon name="arrow" /></a></div> : <div className="analysis-empty"><div className="score-ring"><strong>—</strong><span>Match score</span></div><h2>Paste a role to begin</h2><p>You’ll see matching skills, missing requirements, and practical next steps here.</p></div>}</article>
    </section>
  </>
}
