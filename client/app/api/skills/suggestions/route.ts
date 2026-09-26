import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const accessToken = await getApiAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const requestUrl = new URL(request.url)
  const upstreamUrl = new URL('/api/skills/suggestions', careerOs().SERVER_URL)
  upstreamUrl.search = requestUrl.search

  return upstreamResponse(await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  }))
}
