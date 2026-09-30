import { redirect } from 'next/navigation'
import { auth0 } from '@/lib/auth0'
import { careerOs } from '@/lib/config'
import { AppShell } from '@/components/app-shell'
import { QueryProvider } from '@/components/query-provider'
import type { CurrentUser } from '@/components/types'

export const dynamic = 'force-dynamic'

// Mirrors UserProvisioningService.NormalizePictureUrl: generated avatars (Gravatar, Auth0 defaults) fall back to initials.
function realPicture(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const { hostname, pathname } = new URL(value)
    const generated = hostname === 'gravatar.com' || hostname.endsWith('.gravatar.com') || (hostname === 'cdn.auth0.com' && pathname.startsWith('/avatars/'))
    return generated ? null : value
  } catch {
    return null
  }
}

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession()
  if (!session) redirect('/auth/login?returnTo=/dashboard')

  // The account is provisioned once in the Auth0 callback (lib/auth0.ts). The shell is built from the
  // session cookie alone, so full page loads never wait on the API or Auth0's userinfo endpoint.
  const profile = session.user
  const user: CurrentUser = {
    id: profile.sub ?? 'career-user',
    sub: profile.sub ?? 'career-user',
    email: profile.email ?? null,
    displayName: profile.name ?? profile.nickname ?? profile.email ?? null,
    pictureUrl: realPicture(profile.picture),
  }

  return <QueryProvider><AppShell user={user} skillsAppUrl={careerOs().SKILLS_APP_URL ?? null}>{children}</AppShell></QueryProvider>
}
