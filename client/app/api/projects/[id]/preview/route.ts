import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamFetch, upstreamResponse } from '@/lib/upstream-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getApiAccessToken()
  if (!token) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const { id } = await context.params
  return upstreamResponse(await upstreamFetch(`${careerOs().SERVER_URL}/api/projects/${encodeURIComponent(id)}/preview`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }))
}
