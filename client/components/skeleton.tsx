import type { CSSProperties, ReactNode } from 'react'

/* Skeleton screens: each page's loading state reuses that page's own grid and card classes, so it matches
   at every width, with empty shapes and one shared shimmer sweep. Static parts (headings, notes) are not
   skeletons at all: pages render them for real while the data loads. Text placeholders use `Line`, a box
   with the real line height, so stacked placeholders take exactly the height of the text they stand for. */

type Size = number | string

/** One placeholder shape. Width defaults to the full line. */
export function Bone({ w = '100%', h = 14, r = 8, style }: { w?: Size; h?: Size; r?: Size; style?: CSSProperties }) {
  // <i>, not <span>: page rules that style text spans (e.g. `.pipeline-stage span`) must not reach the shapes.
  return <i className="skeleton" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

/** A line of text: `lh` is the real line height (font size × line-height), `glyph` the visible bar inside it.
    `cardLabel` lines only exist where tables become cards (their cells gain a small label there). */
export function Line({ lh, glyph, w = '100%', cardLabel = false, style }: { lh: Size; glyph: number; w?: Size; cardLabel?: boolean; style?: CSSProperties }) {
  return <div className={cardLabel ? 'skeleton-line skeleton-card-label' : 'skeleton-line'} style={{ height: lh, width: w, ...style }}><Bone h={glyph} /></div>
}

/** Wraps a page skeleton: announced once to screen readers, revealed after a short delay so fast loads never flash. */
export function PageSkeleton({ label, children }: { label: string; children: ReactNode }) {
  return <div className="page-skeleton" role="status" aria-busy="true" aria-label={label}>
    <span className="sr-only">{label}</span>
    {children}
  </div>
}

export const Stack = ({ gap = 0, children, style }: { gap?: number; children: ReactNode; style?: CSSProperties }) => <div className="skeleton-stack" style={{ gap, ...style }}>{children}</div>
export const repeat = (count: number, render: (index: number) => ReactNode) => Array.from({ length: count }, (_, index) => render(index))
export const Actions = ({ count = 3 }: { count?: number }) => <div className="skeleton-row skeleton-end skeleton-nowrap">{repeat(count, index => <Bone key={index} w={36} h={36} r={10} />)}</div>

/** Search, sort and one row of filter chips (the real row never wraps, it scrolls). */
function Toolbar({ chips = 5 }: { chips?: number }) {
  return <section className="collection-toolbar">
    <div className="collection-controls"><div className="skeleton-grow"><Bone h={46} r={12} /></div><div className="skeleton-select"><Bone h={46} r={12} /></div></div>
    <div className="skeleton-row skeleton-nowrap skeleton-clip">{[64, 96, 84, 108, 90, 78].slice(0, chips).map((width, index) => <Bone key={index} w={width} h={36} r={999} />)}</div>
    <div className="collection-summary"><Bone w={64} h={12} /></div>
  </section>
}


export function ApplicationsSkeleton() {
  return <PageSkeleton label="Loading your applications">
    <Toolbar chips={6} />
    <section className="compact-metrics">{repeat(4, index => <article key={index}><Bone w={38} h={38} r={12} /><div className="metric-copy"><Bone w={70} h={13} /></div><div className="metric-value"><Bone w={28} h="1em" r={8} /></div></article>)}</section>
    <section className="resource-table-panel"><div className="skeleton-table">{repeat(6, index => <div key={index} className="skeleton-table-row">
      <Stack gap={2}><Line lh={22} glyph={13} w="min(220px, 70%)" /><Line lh={22} glyph={12} w="min(170px, 55%)" /></Stack>
      <Stack gap={2}><Line cardLabel lh={17} glyph={9} w={50} /><Bone w={92} h={26} r={999} /></Stack>
      <Stack gap={2}><Line cardLabel lh={17} glyph={9} w={44} /><Line lh={20} glyph={11} w={140} /><Line lh={20} glyph={11} w={120} /></Stack>
      <Actions count={4} />
    </div>)}</div></section>
  </PageSkeleton>
}

function SkillCardSkeleton() {
  return <article className="skill-card skeleton-card">
    <Line lh={25} glyph={20} w="65%" />
    <div className="skill-card-category"><Bone w="40%" h={13} /><Bone w={84} h={26} r={999} /></div>
    <div className="skill-card-details">
      <Stack gap={2}><Line lh={18} glyph={9} w={70} /><Line lh={23} glyph={13} w={64} /></Stack>
      <Stack gap={2} style={{ alignItems: 'flex-end' }}><Line lh={18} glyph={9} w={56} /><Line lh={23} glyph={20} w={18} /></Stack>
    </div>
    <div className="skill-card-footer"><Actions /></div>
  </article>
}

export function SkillsSkeleton() {
  return <PageSkeleton label="Loading your skills">
    <Toolbar chips={6} />
    <section className="card-grid">{repeat(8, index => <SkillCardSkeleton key={index} />)}</section>
  </PageSkeleton>
}

export function ProjectsSkeleton() {
  return <PageSkeleton label="Loading your projects">
    <Toolbar chips={4} />
    <section className="project-list">{repeat(3, index => <article key={index} className="project-card skeleton-card">
      <div className="project-art"><Bone h="100%" r={0} /></div>
      <div className="project-information">
        <div className="project-copy">
          <Line lh={25} glyph={20} w="60%" />
          <Line lh={20} glyph={11} w={120} />
          <Stack><Line lh={23} glyph={12} /><Line lh={23} glyph={12} /><Line lh={23} glyph={12} w="70%" /></Stack>
          {/* three skills, then the "+N more" badge on its own row, as projects with several skills show */}
          <Stack gap={6} style={{ marginTop: 4 }}><div className="skeleton-row skeleton-nowrap">{[78, 64, 96].map(width => <Bone key={width} w={width} h={26} r={999} />)}</div><Bone w={110} h={26} r={999} /></Stack>
        </div>
        <div className="project-actions"><Actions /></div>
      </div>
    </article>)}</section>
  </PageSkeleton>
}

/** The result panel while the AI works. */
export function AnalysisResultSkeleton() {
  return <div className="skeleton-analysis" role="status" aria-label="Analyzing your job match" aria-busy="true">
    <Bone w={168} h={168} r="50%" />
    <Stack gap={6} style={{ width: '100%' }}><Line lh={31} glyph={18} w="70%" /><Line lh={25} glyph={12} /><Line lh={25} glyph={12} /><Line lh={25} glyph={12} w="80%" /></Stack>
    {repeat(3, index => <Stack key={index} gap={10} style={{ width: '100%' }}><Line lh={22} glyph={13} w={130} /><div className="skeleton-row">{[64, 92, 78].map(width => <Bone key={width} w={width} h={26} r={999} />)}</div></Stack>)}
  </div>
}

export function SkillCoreSkeleton() {
  return <PageSkeleton label="Loading Skill Core">
    <section className="panel skeleton-explorer">
      <div className="skeleton-explorer-stage"><Stack gap={4}><Line lh={20} glyph={13} w={140} /><Line lh={18} glyph={11} w={220} /></Stack><div className="skeleton-center"><Bone w="min(400px, 80%)" h="auto" r="50%" style={{ aspectRatio: '1' }} /></div></div>
      <div className="skeleton-explorer-side"><Bone w={160} h={18} /><Bone h={40} r={12} /><Stack gap={14}>{repeat(7, index => <div key={index} className="skeleton-row skeleton-nowrap"><Bone w={8} h={8} r="50%" /><Bone w="55%" h={14} /><Bone w={24} h={20} r={999} style={{ marginLeft: 'auto' }} /></div>)}</Stack></div>
    </section>
  </PageSkeleton>
}
