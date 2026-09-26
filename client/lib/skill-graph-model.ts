import type { Skill, SkillLevel } from '@/components/types'

export type Point3 = { x: number; y: number; z: number }
export const levelRank: Record<SkillLevel, number> = { Advanced: 3, Intermediate: 2, Beginner: 1 }
export const categoryColors = ['#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee', '#f472b6', '#a3e635']

export function byProficiency(a: Skill, b: Skill) {
  return levelRank[b.level] - levelRank[a.level] || a.name.localeCompare(b.name) || a.id - b.id
}

export function categoryKey(category: string) { return category.trim().toLocaleLowerCase('en') }

export function buildSkillSphere(skills: Skill[]) {
  const groups = new Map<string, Skill[]>()
  for (const skill of skills) {
    const key = categoryKey(skill.category)
    const members = groups.get(key)
    if (members) members.push(skill)
    else groups.set(key, [skill])
  }
  const categories = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, members], index) => ({
    key, label: members[0].category.trim() || 'Uncategorized', color: categoryColors[index % categoryColors.length], members: members.sort(byProficiency),
  }))
  const ordered = categories.flatMap(category => category.members.map(skill => ({ skill, category })))
  const nodes = ordered.map(({ skill, category }, index) => {
    const y = 1 - 2 * (index + .5) / ordered.length
    const radius = Math.sqrt(1 - y * y)
    const angle = index * Math.PI * (3 - Math.sqrt(5))
    return { skill, category, position: { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius } }
  })
  const edges: Array<{ from: number; to: number; category: string }> = []
  const nodeIndex = new Map(nodes.map((node, index) => [node.skill.id, index]))
  for (const category of categories) {
    const indices = category.members.map(skill => nodeIndex.get(skill.id)!)
    const pairs = new Set<string>()
    const connect = (a: number, b: number) => {
      if (a === b) return
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`
      if (pairs.has(key)) return
      pairs.add(key)
      edges.push({ from: a, to: b, category: category.key })
    }
    // Retain a connected category network without quadratic edge growth.
    indices.forEach((a, i) => {
      if (indices.length <= 8) indices.slice(i + 1).forEach(b => connect(a, b))
      else { connect(a, indices[(i + 1) % indices.length]); connect(a, indices[0]) }
    })
  }
  return { nodes, edges, categories }
}

export function rotatePoint(point: Point3, yaw: number, pitch: number): Point3 {
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw)
  const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw)
  return { x, y: point.y * Math.cos(pitch) - z * Math.sin(pitch), z: point.y * Math.sin(pitch) + z * Math.cos(pitch) }
}

export function projectPoint(point: Point3, width: number, height: number, zoom = 1) {
  const scale = 3.5 / (3.5 - point.z)
  const radius = Math.min(width, height) * .33 * zoom
  return { x: width / 2 + point.x * radius * scale, y: height / 2 + point.y * radius * scale, z: point.z, scale }
}
