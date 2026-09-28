'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Icon } from '@/components/icons'
import type { Skill } from '@/components/types'
import { byProficiency, categoryColors, categoryKey } from '@/lib/skill-graph-model'

const center = 180
const orbitRadius = 120

function BrainMark({ x = center, y = 173, size = 34 }: { x?: number; y?: number; size?: number }) {
  return <foreignObject x={x - size / 2} y={y - size / 2} width={size} height={size}>
    <div className="talent-core-icon-wrap"><Icon className="talent-brain-mark" name="brain" size={size} /></div>
  </foreignObject>
}

export function SkillGraph({ skills, showLevels = true, showCenterLabel = true, showCaption = true, categoryMode = false }: { skills: Skill[]; showLevels?: boolean; showCenterLabel?: boolean; showCaption?: boolean; categoryMode?: boolean }) {
  const visible = useMemo(() => {
    if (!categoryMode) return [...skills].sort(byProficiency).slice(0, 6).map((skill, index) => ({ key: skill.id, label: skill.name, detail: skill.level, color: categoryColors[index % categoryColors.length], skill }))
    const groups = new Map<string, Skill[]>()
    skills.forEach(skill => {
      const key = categoryKey(skill.category)
      groups.set(key, [...(groups.get(key) ?? []), skill])
    })
    return [...groups.entries()].sort(([aKey, aMembers], [bKey, bMembers]) => bMembers.length - aMembers.length || aKey.localeCompare(bKey)).slice(0, 6).map(([key, members], index) => ({
      key, label: members[0].category.trim() || 'Uncategorized', detail: `${members.length} ${members.length === 1 ? 'skill' : 'skills'}`,
      color: categoryColors[index % categoryColors.length], skill: [...members].sort(byProficiency)[0],
    }))
  }, [categoryMode, skills])
  const svg = useRef<SVGSVGElement>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const positions = useMemo(() => visible.map((item, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(visible.length, 1)
    return { ...item, x: center + Math.cos(angle) * orbitRadius, y: center + Math.sin(angle) * orbitRadius }
  }), [visible])

  useEffect(() => {
    const element = svg.current
    if (!element) return
    const groups = element.querySelectorAll<SVGGElement>('[data-talent-node]')
    const lines = element.querySelectorAll<SVGLineElement>('[data-talent-line]')
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, inView = true, last = 0, elapsed = 0
    const current = { x: 0, y: 0 }
    const render = (time: number) => {
      const delta = Math.min(time - (last || time), 40); last = time
      const animate = !media.matches
      if (animate) elapsed += delta
      const ease = 1 - Math.exp(-delta / 140)
      current.x += ((animate ? pointer.current.x : 0) - current.x) * ease
      current.y += ((animate ? pointer.current.y : 0) - current.y) * ease
      positions.forEach((node, index) => {
        const x = node.x + (animate ? Math.sin(elapsed / 1650 + index * 1.9) * 2.5 + current.x * (4 + index * .7) : 0)
        const y = node.y + (animate ? Math.cos(elapsed / 1900 + index * 1.3) * 3 + current.y * (4 + index * .7) : 0)
        groups[index]?.setAttribute('transform', `translate(${x} ${y})`)
        lines[index]?.setAttribute('x2', String(x)); lines[index]?.setAttribute('y2', String(y))
      })
      if (animate && inView && !document.hidden) frame = requestAnimationFrame(render)
    }
    const restart = () => { cancelAnimationFrame(frame); last = 0; frame = requestAnimationFrame(render) }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; restart() })
    observer.observe(element)
    media.addEventListener('change', restart); document.addEventListener('visibilitychange', restart)
    restart()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener('change', restart); document.removeEventListener('visibilitychange', restart) }
  }, [positions])

  return <div className="talent-preview">
    {showCaption && !categoryMode && <div className="talent-preview-top"><span>Top {visible.length} skills · highest level first</span></div>}
    <svg ref={svg} className="talent-preview-scene" viewBox="0 0 360 360" role="img" aria-label={categoryMode ? 'Your skill profile connected to up to six skill categories' : 'Skills surrounded by your six strongest skills, ordered clockwise from advanced to beginner'} onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); pointer.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 } }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 } }}>
      <circle cx={center} cy={center} r={orbitRadius} className="talent-orbit"/>
      <circle cx={center} cy={center} r="92" className="talent-orbit talent-orbit-inner"/>
      {positions.map(({ key, x, y, color }) => <line data-talent-line key={key} x1={center} y1={center} x2={x} y2={y} className="talent-spoke" style={{ stroke: color }}/>)}
      <circle cx={center} cy={center} r="48" className="talent-core-halo"/><circle cx={center} cy={center} r="38" className="talent-core"/>
      <BrainMark y={showCenterLabel ? 173 : center} size={showCenterLabel ? 34 : 42} />
      {showCenterLabel && <text x={center} y="200" textAnchor="middle" className="talent-core-label">Skills</text>}
      {positions.map(({ key, label, detail, color, x, y }, index) => <g data-talent-node key={key} transform={`translate(${x} ${y})`} className="talent-node" style={{ '--talent-level': color } as React.CSSProperties}>
        <title>{categoryMode ? `${index + 1}. ${label}` : `${index + 1}. ${label} · ${detail}`}</title>
        <rect x="-59" y="-23" width="118" height="46" rx="13"/>
        <circle cx="0" cy="-23" r="3"/>
        {categoryMode ? <foreignObject x="-59" y="-23" width="118" height="46">
          <div className="talent-category-label"><span>{label}</span></div>
        </foreignObject> : <text x="0" y={showLevels ? -2 : 0} dominantBaseline={showLevels ? undefined : 'middle'} textAnchor="middle" className="talent-skill-name" fontSize={showLevels ? undefined : 13}>{label.length > (showLevels ? 14 : 12) ? `${label.slice(0, showLevels ? 12 : 11)}…` : label}</text>}
        {showLevels && <text x="0" y="14" textAnchor="middle" className="talent-skill-level">{detail}</text>}
      </g>)}
    </svg>
    {!skills.length && <p className="talent-preview-empty">Add a skill to start your talent map.</p>}
  </div>
}
