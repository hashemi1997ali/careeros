'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type UIEvent } from 'react'
import { Icon } from '@/components/icons'
import type { Skill } from '@/components/types'
import { useSkillsAppUrl } from '@/components/app-shell'
import { buildSkillSphere, categoryKey } from '@/lib/skill-graph-model'
import { createTalentScene } from '@/lib/talent-scene'
import { buildSkillForgeRoadmapUrl } from '@/lib/skillforge'

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
  const listRef = useRef<HTMLDivElement>(null)
  const skillsAppUrl = useSkillsAppUrl()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [listAtTop, setListAtTop] = useState(true)
  const [listAtBottom, setListAtBottom] = useState(true)
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
  const selectedCategory = selected ? model.categories.find(category => category.key === categoryKey(selected.category)) ?? null : model.categories.find(category => category.key === selectedCategoryKey) ?? null
  const visibleCategories = useMemo(() => model.categories.filter(category => category.label.toLowerCase().includes(search.trim().toLowerCase())), [model.categories, search])
  const selectedSkillForgeUrl = buildSkillForgeRoadmapUrl(skillsAppUrl, selected ? [selected.name] : [])

  const updateListEdges = useCallback((element = listRef.current) => {
    if (!element) return
    setListAtTop(element.scrollTop <= 1)
    setListAtBottom(element.scrollTop + element.clientHeight >= element.scrollHeight - 1)
  }, [])

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
      setSelectedCategoryKey(null)
      setRotating(true)
    }, resumeDelay)
  }, [returnZoomHome])

  const onSelect = useCallback((id: number | null) => {
    setSelectedId(id)
    if (id === null) setSelectedCategoryKey(null)
  }, [])

  useEffect(() => {
    if (!canvas.current) return
    const scene = createTalentScene(canvas.current, model, onSelect, resumeAfterIdle, changeZoom)
    engine.current = scene
    const frame = requestAnimationFrame(() => setCanvasReady(Boolean(scene)))
    return () => { cancelAnimationFrame(frame); scene?.dispose(); engine.current = null }
  }, [model, onSelect, resumeAfterIdle, changeZoom])

  useEffect(() => {
    engine.current?.update({ selectedId, selectedCategoryKey, search: search.trim(), zoom, autoRotate: rotating && !reducedMotion, reducedMotion })
  }, [model, selectedId, selectedCategoryKey, search, zoom, rotating, reducedMotion])

  useEffect(() => {
    const element = listRef.current
    if (!element) return
    updateListEdges(element)
    const observer = new ResizeObserver(() => updateListEdges(element))
    observer.observe(element)
    return () => observer.disconnect()
  }, [visibleCategories, updateListEdges])

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current)
    if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current)
  }, [])

  const selectSkill = (id: number) => { const skill = skills.find(item => item.id === id); setSelectedId(id); setSelectedCategoryKey(skill ? categoryKey(skill.category) : null) }
  const selectCategory = (key: string) => { setSelectedId(null); setSelectedCategoryKey(current => current === key ? null : key) }
  const onListScroll = (event: UIEvent<HTMLDivElement>) => updateListEdges(event.currentTarget)

  return <div className="talent-explorer">
    <div className="talent-explorer-grid">
      <section className="talent-stage" aria-label="Interactive skill sphere">
        <div className="talent-stage-caption"><strong>Connected {skills.length} skills</strong><span>Drag the sphere to explore every connection.</span></div>
        <canvas ref={canvas} className="talent-canvas" tabIndex={0} role="img" aria-label={`Interactive three-dimensional graph with ${skills.length} skills. Select skills using the list beside the graph.`} aria-describedby={instructionsId}>Your skills are also available in the skill list beside this graph.</canvas>
        {!canvasReady && <p className="talent-canvas-fallback" role="status">The visual graph is unavailable in this browser. Explore every skill in the list.</p>}
        <div className="talent-stage-footer"><p id={instructionsId}>Drag to rotate · Select a node to explore<br/><span>After you rotate the sphere, it glides home and resumes automatic motion. Keyboard: arrow keys to rotate, + / − to zoom.</span></p><label className="talent-zoom">Zoom<input aria-label="Graph zoom" type="range" min="0.65" max="1.65" step="0.05" value={zoom} onChange={event => changeZoom(Number(event.target.value) - zoomValue.current)}/><output>{Math.round(zoom * 100)}%</output></label></div>
        <div className="talent-edge-key"><span><i/>Connected to Skills</span><span><i/>Related skills</span><span>Larger nodes = higher level</span></div>
      </section>
      <aside className="talent-inspector" aria-label="Explore skill categories">
        <div className="talent-inspector-heading"><h2>Explore categories</h2></div>
        <label className="inline-search talent-category-search"><Icon name="search" size={17}/><input type="search" aria-label="Search categories" placeholder="Search categories" value={search} onChange={event => { setSearch(event.target.value); setSelectedId(null); setSelectedCategoryKey(null) }}/></label>
        <div className="talent-inspector-summary" role="status">{visibleCategories.length} of {model.categories.length} categories</div>
        <div className={`talent-category-list-frame${listAtTop ? ' is-at-top' : ''}${listAtBottom ? ' is-at-bottom' : ''}`}>
          <div ref={listRef} onScroll={onListScroll} className="talent-skill-list talent-category-list" aria-label="Skill categories">
            {visibleCategories.length ? visibleCategories.map(category => <button type="button" key={category.key} aria-pressed={selectedCategory?.key === category.key} onClick={() => selectCategory(category.key)} style={{ '--category-color': category.color } as CSSProperties}><i/><span><strong>{category.label}</strong><small>{category.members.length} {category.members.length === 1 ? 'skill' : 'skills'}</small></span></button>) : <div className="talent-no-results"><strong>No matching categories</strong><button type="button" className="text-link" onClick={() => setSearch('')}>Clear search</button></div>}
          </div>
        </div>
        <div className={`talent-selected${selected ? ' has-selection' : ''}`} aria-live="polite">{selected ? <>
          <div className="talent-selected-main"><h3>{selected.name}</h3><span className={`level-pill ${selected.level}`}>{selected.level}</span></div>
          {selectedSkillForgeUrl && <a className="talent-selected-link" href={selectedSkillForgeUrl} target="_blank" rel="noreferrer"><Icon name="skillforge" size={15}/>Open in SkillForge<Icon name="external" size={13}/></a>}
        </> : selectedCategory ? <>
          <div className="talent-selected-main"><h3>{selectedCategory.label}</h3><span className="talent-category-count">{selectedCategory.members.length} skills</span></div>
          <p className="talent-selected-category-skills">{selectedCategory.members.map(skill => skill.name).join(' · ')}</p>
        </> : <>
          <div className="talent-selected-main"><h3>See how your skills connect</h3></div>
          <p className="talent-selected-description">Select a category or skill in the sphere to explore its connections.</p>
        </>}</div>
      </aside>
    </div>
    {reducedMotion && <p className="talent-motion-note">Automatic motion is off to respect your reduced-motion preference. You can still rotate the graph manually.</p>}
  </div>
}
