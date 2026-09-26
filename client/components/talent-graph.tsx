'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { Icon } from '@/components/icons'
import type { Skill } from '@/components/types'
import { buildSkillSphere, byProficiency, categoryKey } from '@/lib/skill-graph-model'
import { createTalentScene } from '@/lib/talent-scene'

const subscribeMotion = (listener: () => void) => { const media = matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', listener); return () => media.removeEventListener('change', listener) }
const readMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const clampZoom = (value: number) => Math.max(.65, Math.min(1.65, value))
const resumeDelay = 3_000
const returnDuration = 1_400

export function TalentGraph({ skills }: { skills: Skill[] }) {
  const model = useMemo(() => buildSkillSphere(skills), [skills])
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<ReturnType<typeof createTalentScene>>(null)
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const zoomFrame = useRef<number | null>(null)
  const zoomValue = useRef(1)
  const instructionsId = useId()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)
  const [rotating, setRotating] = useState(true)
  const [canvasReady, setCanvasReady] = useState(true)
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, () => true)
  const changeZoom = useCallback((delta: number) => {
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current)
    zoomFrame.current = null
    setZoom(value => {
      const next = clampZoom(value + delta)
      zoomValue.current = next
      return next
    })
  }, [])
  const selected = skills.find(skill => skill.id === selectedId)
  const visible = useMemo(() => [...skills].sort(byProficiency).filter(skill => skill.name.toLowerCase().includes(search.trim().toLowerCase())), [skills, search])

  const returnZoomHome = useCallback(() => {
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current)
    const from = zoomValue.current
    const started = performance.now()
    const animate = (time: number) => {
      const progress = Math.min((time - started) / returnDuration, 1)
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
      const next = from + (1 - from) * eased
      zoomValue.current = next
      setZoom(next)
      if (progress < 1) zoomFrame.current = requestAnimationFrame(animate)
      else zoomFrame.current = null
    }
    zoomFrame.current = requestAnimationFrame(animate)
  }, [])

  const resumeAfterIdle = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    setRotating(false)
    resumeTimer.current = setTimeout(() => {
      engine.current?.resetSmooth(returnDuration)
      returnZoomHome()
      setSelectedId(null)
      setRotating(true)
    }, resumeDelay)
  }, [returnZoomHome])

  const onSelect = useCallback((id: number | null) => setSelectedId(id), [])

  useEffect(() => {
    if (!canvas.current) return
    const scene = createTalentScene(canvas.current, model, onSelect, resumeAfterIdle, changeZoom)
    engine.current = scene
    const frame = requestAnimationFrame(() => setCanvasReady(Boolean(scene)))
    return () => { cancelAnimationFrame(frame); scene?.dispose(); engine.current = null }
  }, [model, onSelect, resumeAfterIdle, changeZoom])

  useEffect(() => {
    engine.current?.update({ selectedId, search: search.trim(), zoom, autoRotate: rotating && !reducedMotion, reducedMotion })
  }, [model, selectedId, search, zoom, rotating, reducedMotion])

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current)
  }, [])

  const selectSkill = (id: number) => {
    setSelectedId(id)
  }

  return <div className="talent-explorer">
    <div className="talent-explorer-bar">
      <div className="talent-scene-meta"><span className="talent-live-dot"/><strong>Your skill universe</strong><span>{skills.length} skills connected to one center</span></div>
    </div>
    <div className="talent-explorer-grid">
      <section className="talent-stage" aria-label="Interactive skill sphere">
        <div className="talent-stage-caption"><span className="eyebrow">CONNECTED SKILLS</span><span>Drag the sphere to explore every connection.</span></div>
        <canvas ref={canvas} className="talent-canvas" tabIndex={0} role="img" aria-label={`Interactive three-dimensional graph with ${skills.length} skills. Select skills using the list beside the graph.`} aria-describedby={instructionsId}>Your skills are also available in the skill list beside this graph.</canvas>
        {!canvasReady && <p className="talent-canvas-fallback" role="status">The visual graph is unavailable in this browser. Explore every skill in the list.</p>}
        <div className="talent-stage-footer"><p id={instructionsId}>Drag to rotate · Select a node to explore<br/><span>After you rotate the sphere, it glides home and resumes automatic motion. Keyboard: arrow keys to rotate, + / − to zoom.</span></p><label className="talent-zoom">Zoom<input aria-label="Graph zoom" type="range" min="0.65" max="1.65" step="0.05" value={zoom} onChange={event => changeZoom(Number(event.target.value) - zoomValue.current)}/><output>{Math.round(zoom * 100)}%</output></label></div>
        <div className="talent-edge-key"><span><i/>Connected to Skills</span><span><i/>Related skills</span><span>Larger nodes = higher level</span></div>
      </section>
      <aside className="talent-inspector" aria-label="Explore skills">
        <div className="talent-inspector-heading"><h2>Explore your skills</h2></div>
        <label className="inline-search"><Icon name="search" size={18}/><input type="search" aria-label="Search graph skills" placeholder="Find a skill" value={search} onChange={event => { setSearch(event.target.value); setSelectedId(null) }}/></label>
        <div className="talent-inspector-summary" role="status">{visible.length} of {skills.length} skills · highest level first</div>
        <div className="talent-skill-list" aria-label="Skills ordered by proficiency">{visible.length ? visible.map(skill => {
          const group = model.categories.find(item => item.key === categoryKey(skill.category))!
          return <button type="button" key={skill.id} aria-pressed={selectedId === skill.id} onClick={() => selectSkill(skill.id)} style={{ '--category-color': group.color } as CSSProperties}><i/><span><strong>{skill.name}</strong></span><span className={`level-pill ${skill.level}`}>{skill.level}</span></button>
        }) : <div className="talent-no-results"><strong>No matching skills</strong><button type="button" className="text-link" onClick={() => setSearch('')}>Clear search</button></div>}</div>
        <div className="talent-selected" aria-live="polite">{selected ? <>
          <div><span className="eyebrow">SELECTED SKILL</span><button type="button" className="talent-motion-toggle" aria-label="Clear selected skill" onClick={() => setSelectedId(null)}><Icon name="x" size={16}/></button></div>
          <h3>{selected.name}</h3><p>{selected.level}</p>
          <p>Connected to Skills and {skills.filter(skill => skill.id !== selected.id && categoryKey(skill.category) === categoryKey(selected.category)).length} related skills.</p>
          <span>{selected.projects.length} linked {selected.projects.length === 1 ? 'project' : 'projects'}</span>
        </> : <><Icon name="graph" size={24}/><h3>See how your skills connect</h3><p>Select a node or a skill above to highlight its related skills and explore its details.</p></>}</div>
      </aside>
    </div>
    {reducedMotion && <p className="talent-motion-note">Automatic motion is off to respect your reduced-motion preference. You can still rotate the graph manually.</p>}
  </div>
}
