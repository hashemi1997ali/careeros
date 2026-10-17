import { useId } from 'react'
import { brainGlyphPaths, glyphSizeFor, skillCoreColors } from '@/lib/skill-core-mark'

/** The Skill Core disc + brain, for use inside an <svg>. `glyphOffset` moves the glyph up to make room for a label. */
export function SkillCoreMark({ cx, cy, r, glyphOffset = 0 }: { cx: number; cy: number; r: number; glyphOffset?: number }) {
  const gradient = useId()
  const size = glyphSizeFor(r)
  return <g className="skill-core-mark">
    <defs>
      <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={skillCoreColors.from} />
        <stop offset="1" stopColor={skillCoreColors.to} />
      </linearGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${gradient})`} />
    <g transform={`translate(${cx - size / 2} ${cy - size / 2 - glyphOffset}) scale(${size / 24})`} fill="none" stroke={skillCoreColors.glyph} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
      {brainGlyphPaths.map(d => <path key={d} d={d} />)}
    </g>
  </g>
}
