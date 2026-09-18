import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const accessToken = await getApiAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const response = await fetch(`${careerOs().SERVER_URL}/api/dashboard`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  return upstreamResponse(response)
}
