import { NextResponse } from 'next/server'
import { getApiAccessToken } from '@/lib/api-auth'
import { auth0 } from '@/lib/auth0'
import { careerOs } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SyncedUser {
  id: string
  authSub: string
  email: string | null
  displayName: string | null
}

export async function GET() {
  const session = await auth0.getSession()
  const accessToken = await getApiAccessToken()

  if (!session || !accessToken) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const response = await fetch(`${careerOs().SERVER_URL}/api/users/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!response.ok) {
    console.error('[api/me] user synchronization failed with status', response.status)
    return NextResponse.json({ error: 'user_sync_failed' }, { status: 502 })
  }

  const { user } = (await response.json()) as { user: SyncedUser }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        sub: user.authSub,
        email: user.email ?? session.user.email ?? null,
        displayName: user.displayName ?? session.user.name ?? null,
      },
      skillsAppUrl: careerOs().SKILLS_APP_URL ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
