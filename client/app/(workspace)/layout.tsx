import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { careerOs } from '@/lib/config'
import { AppShell } from '@/components/app-shell'
import { QueryProvider } from '@/components/query-provider'
import type { CurrentUser } from '@/components/types'

export const dynamic = 'force-dynamic'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login?returnTo=/dashboard')

  const user: CurrentUser = {
    id: session.user.sub ?? 'career-user',
    sub: session.user.sub ?? 'career-user',
    email: session.user.email ?? null,
    displayName: ([session.user.given_name, session.user.family_name].filter(Boolean).join(' ') || session.user.name) ?? null,
  }

  return <QueryProvider><AppShell user={user} skillsAppUrl={careerOs().SKILLS_APP_URL ?? null}>{children}</AppShell></QueryProvider>
}
