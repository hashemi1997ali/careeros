import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { getApiAccessToken } from '@/lib/api-auth'
import { careerOs } from '@/lib/config'
import { AppShell } from '@/components/app-shell'
import { QueryProvider } from '@/components/query-provider'
import type { CurrentUser } from '@/components/types'

export const dynamic = 'force-dynamic'

interface SyncedUser {
  email: string | null
  displayName: string | null
  pictureUrl: string | null
}

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login?returnTo=/dashboard')

  let syncedUser: SyncedUser | null = null
  const accessToken = await getApiAccessToken()
  if (accessToken) {
    try {
      const response = await fetch(`${careerOs().SERVER_URL}/api/users/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (response.ok) {
        const payload = (await response.json()) as { user: SyncedUser }
        syncedUser = payload.user
      }
    } catch (error) {
      console.error('[workspace] user synchronization failed', error)
    }
  }

  const user: CurrentUser = {
    id: session.user.sub ?? 'career-user',
    sub: session.user.sub ?? 'career-user',
    email: syncedUser ? syncedUser.email : session.user.email ?? null,
    displayName: syncedUser ? syncedUser.displayName : ([session.user.given_name, session.user.family_name].filter(Boolean).join(' ') || session.user.name) ?? null,
    pictureUrl: syncedUser?.pictureUrl ?? null,
  }

  return <QueryProvider><AppShell user={user} skillsAppUrl={careerOs().SKILLS_APP_URL ?? null}>{children}</AppShell></QueryProvider>
}
