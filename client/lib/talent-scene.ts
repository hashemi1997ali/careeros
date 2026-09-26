import { levelRank, projectPoint, rotatePoint, type buildSkillSphere, type Point3 } from '@/lib/skill-graph-model'

type Model = ReturnType<typeof buildSkillSphere>
export type SceneOptions = { selectedId: number | null; search: string; zoom: number; autoRotate: boolean; reducedMotion: boolean }
type Projected = ReturnType<typeof projectPoint> & { index: number }

/** Perspective projection of a rotating 3D unit sphere, drawn at device resolution. */
export function createTalentScene(canvas: HTMLCanvasElement, model: Model, onSelect: (id: number | null) => void, onPause: () => void, onZoom: (delta: number) => void) {
  const context = canvas.getContext('2d')
  if (!context) return null
  const ctx: CanvasRenderingContext2D = context
  let options: SceneOptions = { selectedId: null, search: '', zoom: 1, autoRotate: true, reducedMotion: false }
  let width = 1, height = 1, ratio = 1, yaw = .3, pitch = -.15, frame = 0, last = 0, inView = true
  let velocityX = 0, velocityY = 0, hover: number | null = null
  let homeTransition: { started: number; duration: number; fromYaw: number; toYaw: number; fromPitch: number } | null = null
  let drag: { id: number; x: number; y: number; distance: number; lastTime: number } | null = null
  let projected: Projected[] = []
  let ink = '#e9f0fb', muted = '#a8b9d4', surface = '#0f2038', dark = true
  const brainImage = new Image()
  brainImage.decoding = 'async'
  brainImage.src = '/images/icons/brain-2023630.png'
  const labels: Array<{ index: number; x: number; y: number; w: number; h: number }> = []
  const wireframes: Point3[][] = []
  for (let latitude = -2; latitude <= 2; latitude++) {
    const a = latitude * Math.PI / 6
    wireframes.push(Array.from({ length: 73 }, (_, i) => { const b = i / 72 * Math.PI * 2; return { x: Math.cos(a) * Math.cos(b), y: Math.sin(a), z: Math.cos(a) * Math.sin(b) } }))
  }
  for (let meridian = 0; meridian < 4; meridian++) {
    const a = meridian * Math.PI / 4
    wireframes.push(Array.from({ length: 73 }, (_, i) => { const b = i / 72 * Math.PI * 2; return { x: Math.cos(b) * Math.cos(a), y: Math.sin(b), z: Math.cos(b) * Math.sin(a) } }))
  }
  const isMatch = (index: number) => {
    const node = model.nodes[index]
    return !options.search || node.skill.name.toLowerCase().includes(options.search.toLowerCase())
  }
  const point = (p: Point3) => projectPoint(rotatePoint(p, yaw, pitch), width, height, options.zoom)
  const line = (a: { x: number; y: number }, b: { x: number; y: number }, color: string, alpha: number, weight = 1) => {
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = weight
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
  }
  const circle = (x: number, y: number, radius: number, color: string, alpha = 1) => {
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill()
  }
  const drawBrain = (x: number, y: number) => {
    if (!brainImage.complete || !brainImage.naturalWidth) return
    ctx.save()
    ctx.globalAlpha = .76
    ctx.drawImage(brainImage, x - 17, y - 17, 34, 34)
    ctx.restore()
  }
  const draw = () => {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height)
    const center = { x: width / 2, y: height / 2 }
    for (let i = 0; i < 55; i++) circle((i * 157.3 % width), (i * 93.7 % height), i % 3 === 0 ? 1.3 : .7, muted, .2)
    ctx.lineWidth = 1; ctx.strokeStyle = muted; ctx.globalAlpha = dark ? .13 : .17
    for (const ring of wireframes) {
      ctx.beginPath(); ring.forEach((p, index) => { const v = point(p); if (index) ctx.lineTo(v.x, v.y); else ctx.moveTo(v.x, v.y) }); ctx.stroke()
    }
    projected = model.nodes.map((node, index) => ({ ...point(node.position), index }))
    const active = hover ?? options.selectedId
    const activeNode = model.nodes.find(node => node.skill.id === active)
    for (const edge of model.edges) {
      const a = projected[edge.from], b = projected[edge.to]
      const related = activeNode?.category.key === edge.category
      const matched = isMatch(edge.from) && isMatch(edge.to)
      line(a, b, model.nodes[edge.from].category.color, related ? .55 : matched ? (dark ? .2 : .3) : .045, related ? 1.4 : .8)
    }
    if (activeNode) {
      const source = projected.find(p => model.nodes[p.index].skill.id === activeNode.skill.id)
      if (source) for (const target of projected) {
        const node = model.nodes[target.index]
        if (node.skill.id !== activeNode.skill.id && node.category.key === activeNode.category.key) line(source, target, node.category.color, .6, 1.4)
      }
    }
    for (const p of projected) {
      const node = model.nodes[p.index], selected = node.skill.id === active
      line(center, p, node.category.color, selected ? .85 : isMatch(p.index) ? .12 + (p.z + 1) * .1 : .035, selected ? 1.8 : .8)
    }
    const sorted = [...projected].sort((a, b) => a.z - b.z)
    const drawNode = (p: Projected) => {
      const node = model.nodes[p.index], active = node.skill.id === hover || node.skill.id === options.selectedId
      const opacity = isMatch(p.index) || active ? .45 + (p.z + 1) * .275 : .13
      const radius = (3.5 + levelRank[node.skill.level]) * p.scale
      if (active) {
        circle(p.x, p.y, radius + 11, node.category.color, .12)
        ctx.globalAlpha = .8; ctx.strokeStyle = node.category.color; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(p.x, p.y, radius + 5, 0, Math.PI * 2); ctx.stroke()
      }
      circle(p.x, p.y, radius + 2, surface, opacity)
      circle(p.x, p.y, radius, node.category.color, opacity)
      circle(p.x - radius * .25, p.y - radius * .3, radius * .28, '#ffffff', opacity * .75)
    }
    sorted.forEach(drawNode)
    const glow = ctx.createRadialGradient(center.x, center.y, 6, center.x, center.y, 68)
    glow.addColorStop(0, '#34d39944'); glow.addColorStop(1, '#34d39900')
    ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(center.x, center.y, 68, 0, Math.PI * 2); ctx.fill()
    circle(center.x, center.y, 35, surface)
    const core = ctx.createLinearGradient(center.x - 30, center.y - 30, center.x + 30, center.y + 30)
    core.addColorStop(0, '#6ee7c8'); core.addColorStop(1, '#14b8a6')
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(center.x, center.y, 30, 0, Math.PI * 2); ctx.fill()
    drawBrain(center.x, center.y - 7)
    ctx.fillStyle = '#063e35'; ctx.textAlign = 'center'; ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText('Skills', center.x, center.y + 20)
    labels.length = 0
    const labelNodes = [...projected].sort((a, b) => {
      const priority = (p: Projected) => model.nodes[p.index].skill.id === active ? 10 : p.z
      return priority(b) - priority(a)
    })
    for (const p of labelNodes) {
      const node = model.nodes[p.index], selected = node.skill.id === active
      if ((!isMatch(p.index) && !selected) || (!selected && model.nodes.length > 35 && p.z < -.1)) continue
      ctx.font = `${selected ? 600 : 500} ${selected ? 13 : 12}px system-ui, sans-serif`
      let name = node.skill.name
      while (ctx.measureText(name).width > Math.min(170, width * .42) && name.length > 3) name = name.slice(0, -2) + '…'
      const w = ctx.measureText(name).width + 16, h = 26
      const x = Math.max(6, Math.min(width - w - 6, p.x - w / 2)), y = Math.max(6, Math.min(height - h - 6, p.y + 11 * p.scale))
      if (!selected && labels.some(label => x < label.x + label.w + 3 && x + w + 3 > label.x && y < label.y + label.h + 3 && y + h + 3 > label.y)) continue
      if (!selected && x < center.x + 36 && x + w > center.x - 36 && y < center.y + 36 && y + h > center.y - 36) continue
      ctx.globalAlpha = selected ? 1 : .7 + (p.z + 1) * .15
      ctx.fillStyle = surface; ctx.beginPath(); ctx.roundRect(x, y, w, h, 7); ctx.fill()
      if (selected) { ctx.strokeStyle = node.category.color; ctx.lineWidth = 1; ctx.stroke() }
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.fillText(name, x + w / 2, y + 17)
      labels.push({ index: p.index, x, y, w, h })
    }
    ctx.globalAlpha = 1
  }
  const tick = (time: number) => {
    frame = 0
    const delta = Math.min((time - (last || time)) / 1000, .04); last = time
    if (homeTransition && !drag && !options.reducedMotion) {
      const progress = Math.min((time - homeTransition.started) / homeTransition.duration, 1)
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
      yaw = homeTransition.fromYaw + (homeTransition.toYaw - homeTransition.fromYaw) * eased
      pitch = homeTransition.fromPitch + (-.15 - homeTransition.fromPitch) * eased
      if (progress >= 1) homeTransition = null
    } else if (!drag && !options.reducedMotion) {
      yaw += velocityX * delta; pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch + velocityY * delta))
      velocityX *= Math.exp(-delta * 5); velocityY *= Math.exp(-delta * 5)
      if (options.autoRotate) yaw += delta * .075
    }
    draw()
    if (inView && !document.hidden && !options.reducedMotion && (homeTransition || options.autoRotate || Math.abs(velocityX) + Math.abs(velocityY) > .005)) frame = requestAnimationFrame(tick)
  }
  const request = () => { if (!frame && inView && !document.hidden) frame = requestAnimationFrame(tick) }
  const readTheme = () => {
    const style = getComputedStyle(canvas)
    ink = style.getPropertyValue('--ink').trim() || ink; muted = style.getPropertyValue('--muted').trim() || muted; surface = style.getPropertyValue('--surface').trim() || surface
    dark = document.documentElement.dataset.theme === 'dark'; request()
  }
  const resize = () => {
    const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height)
    ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); request()
  }
  const pick = (x: number, y: number) => {
    if (Math.hypot(x - width / 2, y - height / 2) < 35) return null
    const label = labels.find(label => x >= label.x && x <= label.x + label.w && y >= label.y && y <= label.y + label.h)
    if (label) return model.nodes[label.index].skill.id
    const hit = [...projected].sort((a, b) => b.z - a.z).find(p => isMatch(p.index) && Math.hypot(p.x - x, p.y - y) < Math.max(16, p.scale * 10))
    return hit ? model.nodes[hit.index].skill.id : null
  }
  const down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return
    canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId)
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0, lastTime: event.timeStamp }; velocityX = 0; velocityY = 0; hover = null
    homeTransition = null; canvas.style.cursor = 'grabbing'
  }
  const move = (event: PointerEvent) => {
    if (drag?.id === event.pointerId) {
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y, dt = Math.max(16, event.timeStamp - drag.lastTime)
      yaw += dx * .006; pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch - dy * .006))
      velocityX = dx * 6 / dt; velocityY = dy * 6 / dt
      const moved = Math.hypot(dx, dy)
      drag = { ...drag, x: event.clientX, y: event.clientY, distance: drag.distance + moved, lastTime: event.timeStamp }
      if (moved > 0) { options.autoRotate = false; onPause() }
      request()
    } else if (!drag) {
      const rect = canvas.getBoundingClientRect(); hover = pick(event.clientX - rect.left, event.clientY - rect.top)
      canvas.style.cursor = hover === null ? 'grab' : 'pointer'; request()
    }
  }
  const end = (event: PointerEvent) => {
    if (drag?.id !== event.pointerId) return
    const rect = canvas.getBoundingClientRect()
    if (event.type === 'pointerup' && drag.distance < 5) onSelect(pick(event.clientX - rect.left, event.clientY - rect.top))
    if (event.timeStamp - drag.lastTime > 100 || event.type !== 'pointerup') { velocityX = 0; velocityY = 0 }
    const rotated = drag.distance >= 5
    drag = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    canvas.style.cursor = 'grab'; if (rotated) onPause(); request()
  }
  const leave = () => { hover = null; request() }
  const wheel = (event: WheelEvent) => { if (document.activeElement !== canvas) return; event.preventDefault(); onZoom(event.deltaY < 0 ? .08 : -.08) }
  const key = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(event.key)) return
    event.preventDefault(); velocityX = 0; velocityY = 0
    const rotates = event.key.startsWith('Arrow')
    if (rotates) { options.autoRotate = false; homeTransition = null; onPause() }
    if (event.key === 'ArrowLeft') yaw -= .15
    if (event.key === 'ArrowRight') yaw += .15
    if (event.key === 'ArrowUp') pitch = Math.max(-Math.PI / 2, pitch - .15)
    if (event.key === 'ArrowDown') pitch = Math.min(Math.PI / 2, pitch + .15)
    if (event.key === '+' || event.key === '=') onZoom(.1)
    if (event.key === '-') onZoom(-.1)
    if (event.key === 'Home') { yaw = .3; pitch = -.15; onZoom(1 - options.zoom) }
    request()
  }
  const visibility = () => { last = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else request() }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas)
  const themeObserver = new MutationObserver(readTheme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  const intersectionObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; last = 0; if (inView) request(); else { cancelAnimationFrame(frame); frame = 0 } }); intersectionObserver.observe(canvas)
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('wheel', wheel, { passive: false }); canvas.addEventListener('keydown', key); document.addEventListener('visibilitychange', visibility)
  brainImage.addEventListener('load', request)
  readTheme(); resize()
  return {
    update(next: SceneOptions) { options = next; if (next.reducedMotion) { velocityX = 0; velocityY = 0 }; request() },
    resetSmooth(duration = 1400) {
      const turn = Math.PI * 2
      const toYaw = .3 + Math.round((yaw - .3) / turn) * turn
      velocityX = 0; velocityY = 0
      if (options.reducedMotion) { yaw = toYaw; pitch = -.15; homeTransition = null }
      else homeTransition = { started: performance.now(), duration, fromYaw: yaw, toYaw, fromPitch: pitch }
      request()
    },
    dispose() {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); themeObserver.disconnect(); intersectionObserver.disconnect()
      brainImage.removeEventListener('load', request)
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', end); canvas.removeEventListener('pointercancel', end); canvas.removeEventListener('lostpointercapture', end); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility)
    },
  }
}
