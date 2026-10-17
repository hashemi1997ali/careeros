/* The Skill Core mark: a teal disc with a white brain glyph. One definition for the dashboard SVG,
   the Skill Core canvas and anywhere else, so it looks identical and stays sharp at every size.
   The glyph is lucide's "brain" (the same one the Skills navigation icon uses), drawn on a 24-unit grid. */

export const brainGlyphPaths = [
  'M12 18V5',
  'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4',
  'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5',
  'M17.997 5.125a4 4 0 0 1 2.526 5.77',
  'M18 18a4 4 0 0 0 2-7.464',
  'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517',
  'M6 18a4 4 0 0 1-2-7.464',
  'M6.003 5.125a4 4 0 0 0-2.526 5.77',
] as const

export const skillCoreColors = { from: '#6ee7c8', to: '#14b8a6', glyph: '#ffffff', glow: '#34d399' } as const

/** Glyph box size for a disc of radius `r`. */
export const glyphSizeFor = (r: number) => r * 1.15

/** Draws the mark on a 2D canvas centred at (x, y). */
export function drawSkillCoreMark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const disc = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
  disc.addColorStop(0, skillCoreColors.from); disc.addColorStop(1, skillCoreColors.to)
  ctx.save()
  ctx.globalAlpha = 1; ctx.fillStyle = disc
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  const size = glyphSizeFor(r), scale = size / 24
  ctx.translate(x - size / 2, y - size / 2); ctx.scale(scale, scale)
  ctx.strokeStyle = skillCoreColors.glyph; ctx.globalAlpha = 0.95
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const d of brainGlyphPaths) ctx.stroke(new Path2D(d))
  ctx.restore()
}
