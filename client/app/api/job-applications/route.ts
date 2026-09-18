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
  const upstreamUrl = new URL('/api/job-applications', careerOs().SERVER_URL)
  upstreamUrl.search = requestUrl.search

  const response = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  return upstreamResponse(response)
}

export async function POST(request: Request) {
  const accessToken = await getApiAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const response = await fetch(`${careerOs().SERVER_URL}/api/job-applications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  return upstreamResponse(response)
}
