import type { CSSProperties, ReactNode } from 'react'

/* Skeleton screens: each page's loading state is its own layout (same grid and card classes as the real page,
   so it matches at every width) with empty shapes and one shared shimmer sweep. */

type Size = number | string

/** One placeholder shape. Width defaults to the full line. */
export function Bone({ w = '100%', h = 14, r = 8, style }: { w?: Size; h?: Size; r?: Size; style?: CSSProperties }) {
  // <i>, not <span>: page rules that style text spans (e.g. `.pipeline-stage span`) must not reach the shapes.
  return <i className="skeleton" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

/** Wraps a page skeleton: announced once to screen readers, revealed after a short delay so fast loads never flash. */
export function PageSkeleton({ label, children }: { label: string; children: ReactNode }) {
  return <div className="page-skeleton" role="status" aria-busy="true" aria-label={label}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
}

const Stack = ({ gap = 10, children }: { gap?: number; children: ReactNode }) => <div className="skeleton-stack" style={{ gap }}>{children}</div>

function Heading({ actions = 1 }: { actions?: number }) {
  return <section className="page-heading">
    <Stack><Bone w={110} h={11} /><Bone w="min(340px, 75%)" h={40} r={10} /><Bone w="min(260px, 60%)" h={16} /></Stack>
    {actions > 0 && <div className="talent-page-actions">{Array.from({ length: actions }, (_, index) => <Bone key={index} w={index ? 150 : 128} h={44} r={999} />)}</div>}
  </section>
}

function Toolbar({ chips = 5 }: { chips?: number }) {
  return <section className="collection-toolbar">
    <div className="collection-controls"><div className="skeleton-grow"><Bone h={46} r={12} /></div><div className="skeleton-select"><Bone h={46} r={12} /></div></div>
    <div className="skeleton-row">{[64, 96, 84, 108, 90, 78].slice(0, chips).map((width, index) => <Bone key={index} w={width} h={36} r={999} />)}</div>
    <Bone w={64} h={12} />
  </section>
}

function PanelTitle({ wide = 150 }: { wide?: number }) {
  return <div className="panel-title"><Bone w={38} h={38} r={12} /><Stack gap={8}><Bone w={wide} h={16} /><Bone w={wide + 40} h={12} /></Stack></div>
}

const repeat = (count: number, render: (index: number) => ReactNode) => Array.from({ length: count }, (_, index) => render(index))

export function DashboardSkeleton() {
  return <PageSkeleton label="Loading your dashboard">
    <Heading actions={0} />
    <section className="dashboard-grid">
      <article className="panel dashboard-summary">{repeat(3, index => <div key={index} className="summary-figure"><Bone w={110} h={12} /><Bone w={64} h={44} r={10} /><Bone w="70%" h={12} /></div>)}</article>
      <div className="skeleton-media" style={{ gridArea: 'rem' }}><Bone h="100%" r="inherit" /></div>
      <article className="panel pipeline-panel"><PanelTitle /><Bone h={14} r={999} style={{ marginBottom: 'var(--space-lg)' }} /><div className="pipeline-list">{repeat(7, index => <div key={index} className="pipeline-stage"><Bone w={8} h={8} r="50%" /><Bone w="55%" h={12} /><Bone w={14} h={16} style={{ marginLeft: 'auto' }} /></div>)}</div></article>
      <article className="panel gap-panel"><PanelTitle /><Stack gap={18}>{repeat(3, index => <div key={index} className="skeleton-row skeleton-nowrap"><Bone w="35%" h={14} /><Bone w={0} h={8} r={999} style={{ flex: 1 }} /><Bone w={16} h={14} /></div>)}</Stack></article>
      <article className="panel skill-summary-panel"><PanelTitle /><div className="skeleton-center"><Bone w="min(240px, 70%)" h={0} r="50%" style={{ aspectRatio: '1', height: 'auto' }} /></div></article>
      <article className="panel applications-panel"><PanelTitle wide={170} /><Stack gap={16}>{repeat(3, index => <div key={index} className="skeleton-row skeleton-nowrap"><Stack gap={8}><Bone w="min(240px, 50vw)" h={15} /><Bone w="min(180px, 40vw)" h={13} /></Stack><Bone w={86} h={26} r={999} style={{ marginLeft: 'auto' }} /></div>)}</Stack></article>
    </section>
  </PageSkeleton>
}

export function ApplicationsSkeleton() {
  return <PageSkeleton label="Loading your applications">
    <Heading />
    <Toolbar chips={6} />
    <section className="compact-metrics">{repeat(4, index => <article key={index}><Bone w={38} h={38} r={12} /><div className="metric-copy"><Bone w={70} h={13} /></div><Bone w={28} h={30} r={8} /></article>)}</section>
    <section className="resource-table-panel"><div className="skeleton-table">{repeat(6, index => <div key={index} className="skeleton-table-row">
      <Stack gap={8}><Bone w="min(220px, 70%)" h={15} /><Bone w="min(170px, 55%)" h={13} /></Stack>
      <Bone w={92} h={26} r={999} />
      <Stack gap={8}><Bone w={140} h={12} /><Bone w={120} h={12} /></Stack>
      <div className="skeleton-row skeleton-end">{repeat(3, action => <Bone key={action} w={36} h={36} r={10} />)}</div>
    </div>)}</div></section>
  </PageSkeleton>
}

function SkillCardSkeleton() {
  return <article className="skill-card skeleton-card">
    <Bone w="65%" h={22} r={6} />
    <div className="skeleton-row skeleton-nowrap"><Bone w="40%" h={14} /><Bone w={84} h={26} r={999} style={{ marginLeft: 'auto' }} /></div>
    <div className="skill-card-details"><Stack gap={6}><Bone w={70} h={10} /><Bone w={64} h={14} /></Stack><Stack gap={6}><Bone w={56} h={10} /><Bone w={18} h={20} style={{ marginLeft: 'auto' }} /></Stack></div>
    <div className="skill-card-footer"><div className="skeleton-row skeleton-end">{repeat(3, index => <Bone key={index} w={36} h={36} r={10} />)}</div></div>
  </article>
}

export function SkillsSkeleton() {
  return <PageSkeleton label="Loading your skills">
    <Heading actions={2} />
    <Toolbar chips={6} />
    <section className="card-grid">{repeat(8, index => <SkillCardSkeleton key={index} />)}</section>
  </PageSkeleton>
}

export function ProjectsSkeleton() {
  return <PageSkeleton label="Loading your projects">
    <Heading />
    <Toolbar chips={4} />
    <section className="project-list">{repeat(3, index => <article key={index} className="project-card skeleton-card">
      <div className="project-art"><Bone h="100%" r={0} /></div>
      <div className="project-information">
        <Stack gap={10}><Bone w="60%" h={22} r={6} /><Bone w={120} h={12} /><Bone h={13} /><Bone w="85%" h={13} /></Stack>
        <div className="skeleton-row">{[78, 64, 96].map(width => <Bone key={width} w={width} h={26} r={999} />)}</div>
        <div className="project-actions"><div className="skeleton-row skeleton-end">{repeat(3, action => <Bone key={action} w={36} h={36} r={10} />)}</div></div>
      </div>
    </article>)}</section>
  </PageSkeleton>
}

/** The analysis panel while the AI works (also used inside the analyzer page). */
export function AnalysisResultSkeleton() {
  return <div className="skeleton-analysis" role="status" aria-label="Analyzing your job match" aria-busy="true">
    <Bone w={168} h={168} r="50%" />
    <Stack gap={10}><Bone w="70%" h={20} r={6} /><Bone h={13} /><Bone h={13} /><Bone w="80%" h={13} /></Stack>
    {repeat(3, index => <Stack key={index} gap={10}><Bone w={130} h={14} /><div className="skeleton-row">{[64, 92, 78].map(width => <Bone key={width} w={width} h={26} r={999} />)}</div></Stack>)}
  </div>
}

export function AnalyzerSkeleton() {
  return <PageSkeleton label="Loading the analyzer">
    <Heading actions={0} />
    <Bone h={74} r="var(--radius-lg)" style={{ marginBottom: 'var(--space-lg)' }} />
    <section className="analyzer-grid">
      <article className="panel"><PanelTitle wide={190} /><Stack gap={12}><Bone w={120} h={13} /><Bone h={46} r={12} /><Bone w={140} h={13} /><Bone h={220} r={12} /><Bone h={44} r={999} /></Stack></article>
      <article className="panel"><PanelTitle /><AnalysisResultSkeleton /></article>
    </section>
  </PageSkeleton>
}

export function SkillCoreSkeleton() {
  return <PageSkeleton label="Loading Skill Core">
    <Heading actions={2} />
    <section className="panel skeleton-explorer">
      <div className="skeleton-explorer-stage"><Stack gap={8}><Bone w={140} h={14} /><Bone w={220} h={12} /></Stack><div className="skeleton-center"><Bone w="min(400px, 80%)" h="auto" r="50%" style={{ aspectRatio: '1' }} /></div></div>
      <div className="skeleton-explorer-side"><Bone w={160} h={18} /><Bone h={40} r={12} /><Stack gap={14}>{repeat(7, index => <div key={index} className="skeleton-row skeleton-nowrap"><Bone w={8} h={8} r="50%" /><Bone w="55%" h={14} /><Bone w={24} h={20} r={999} style={{ marginLeft: 'auto' }} /></div>)}</Stack></div>
    </section>
  </PageSkeleton>
}

/** Route-level fallback while a workspace page's code loads: a neutral page shape. */
export function WorkspaceSkeleton() {
  return <PageSkeleton label="Loading your workspace">
    <Heading />
    <Toolbar />
    <section className="card-grid">{repeat(6, index => <div key={index} className="skeleton-media skeleton-tile"><Bone h="100%" r="inherit" /></div>)}</section>
  </PageSkeleton>
}
