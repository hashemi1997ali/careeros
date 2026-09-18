import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { skills } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const accessToken = await getApiAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const response = await fetch(`${skills().SKILLS_API_URL}/api/public/skills`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  return upstreamResponse(response)
}
