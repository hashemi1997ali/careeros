'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TalentGraph } from '@/components/talent-graph'
import { EmptyState } from '@/components/empty-state'
import { usePageState } from '@/components/page-state'
import { Icon } from '@/components/icons'
import type { Skill } from '@/components/types'
import { apiFetch } from '@/lib/api-client'

export default function SkillGraphPage() {
  const query = useQuery({ queryKey: ['skills'], queryFn: ({ signal }) => apiFetch<Skill[]>('/api/skills', { signal }) })
  const pageState = usePageState([query], 'Loading Skill Core')
  if (pageState) return pageState

  return <>
    <section className="page-heading"><div><p className="eyebrow">YOUR SKILLS, CONNECTED</p><h1>Skill Core</h1><p>Explore your skills and their connections.</p></div><div className="talent-page-actions"><Link className="button button-ghost" href="/skills"><Icon name="grid" size={17}/>Skills list</Link><Link className="button button-primary" href="/skills?new=1"><Icon name="plus" size={17}/>Add skill</Link></div></section>
    {query.data?.length ? <TalentGraph skills={query.data}/> : <section className="panel"><EmptyState title="Your Skill Core starts with one skill" description="Add skills and proficiency levels to see them orbit your skill center." action={<Link className="button button-primary" href="/skills?new=1"><Icon name="plus" size={17}/>Add your first skill</Link>}/></section>}
  </>
}
