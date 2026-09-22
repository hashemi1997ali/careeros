export function buildSkillForgeRoadmapUrl(baseUrl: string | null, skillNames: string[]) {
  if (!baseUrl || skillNames.length === 0) return null

  const url = new URL('/roadmap', `${baseUrl}/`)
  url.searchParams.set('skills', skillNames.join(','))
  url.searchParams.set('source', 'careeros')
  return url.toString()
}
