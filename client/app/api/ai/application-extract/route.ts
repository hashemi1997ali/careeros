import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { upstreamResponse } from '@/lib/upstream-response'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const accessToken = await getApiAccessToken()
  if (!accessToken) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  return upstreamResponse(await fetch(`${careerOs().SERVER_URL}/api/ai/application-extract`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: await request.text(),
    cache: 'no-store',
  }))
}
