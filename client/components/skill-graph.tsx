'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { Skill } from '@/components/types'
import { byProficiency } from '@/lib/skill-graph-model'

const center = 180
const orbitRadius = 125

function BrainMark({ x = center, y = 173, size = 34 }: { x?: number; y?: number; size?: number }) {
  return <image className="talent-brain-mark" href="/images/icons/brain-2023630.png" x={x - size / 2} y={y - size / 2} width={size} height={size} preserveAspectRatio="xMidYMid meet" aria-hidden="true"/>
}

export function SkillGraph({ skills, showLevels = true, showCenterLabel = true, showCaption = true }: { skills: Skill[]; showLevels?: boolean; showCenterLabel?: boolean; showCaption?: boolean }) {
  const visible = useMemo(() => [...skills].sort(byProficiency).slice(0, 6), [skills])
  const svg = useRef<SVGSVGElement>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const positions = useMemo(() => visible.map((skill, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(visible.length, 1)
    return { skill, x: center + Math.cos(angle) * orbitRadius, y: center + Math.sin(angle) * orbitRadius }
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
    {showCaption && <div className="talent-preview-top"><span>Top {visible.length} skills · highest level first</span></div>}
    <svg ref={svg} className="talent-preview-scene" viewBox="0 0 360 360" role="img" aria-label="Skills surrounded by your six strongest skills, ordered clockwise from advanced to beginner" onPointerMove={event => { const rect = event.currentTarget.getBoundingClientRect(); pointer.current = { x: (event.clientX - rect.left) / rect.width * 2 - 1, y: (event.clientY - rect.top) / rect.height * 2 - 1 } }} onPointerLeave={() => { pointer.current = { x: 0, y: 0 } }}>
      <circle cx={center} cy={center} r={orbitRadius} className="talent-orbit"/>
      <circle cx={center} cy={center} r="92" className="talent-orbit talent-orbit-inner"/>
      {positions.map(({ skill, x, y }) => <line data-talent-line key={skill.id} x1={center} y1={center} x2={x} y2={y} className={`talent-spoke talent-${skill.level}`}/>)}
      <circle cx={center} cy={center} r="48" className="talent-core-halo"/><circle cx={center} cy={center} r="38" className="talent-core"/>
      <BrainMark y={showCenterLabel ? 173 : center} size={showCenterLabel ? 34 : 42} />
      {showCenterLabel && <text x={center} y="200" textAnchor="middle" className="talent-core-label">Skills</text>}
      {positions.map(({ skill, x, y }, index) => <g data-talent-node key={skill.id} transform={`translate(${x} ${y})`} className={`talent-node talent-${skill.level}`}>
        <title>{index + 1}. {skill.name} · {skill.level}</title>
        <rect x="-51" y="-23" width="102" height="46" rx="13"/>
        <circle cx="0" cy="-23" r="3"/>
        <text x="0" y={showLevels ? -2 : 0} dominantBaseline={showLevels ? undefined : 'central'} textAnchor="middle" className="talent-skill-name" fontSize={showLevels ? undefined : 18}>{skill.name.length > (showLevels ? 14 : 10) ? `${skill.name.slice(0, showLevels ? 12 : 8)}…` : skill.name}</text>
        {showLevels && <text x="0" y="14" textAnchor="middle" className="talent-skill-level">{skill.level}</text>}
      </g>)}
    </svg>
    {!skills.length && <p className="talent-preview-empty">Add a skill to start your talent map.</p>}
  </div>
}
