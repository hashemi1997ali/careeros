import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'

const audience = process.env.AUTH0_AUDIENCE

export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: 'openid profile email offline_access',
    ...(audience ? { audience } : {}),
  },
  enableAccessTokenEndpoint: false,
  tokenRefreshBuffer: 60,
  onCallback: async (error, context, session) => {
    if (error) {
      console.error('[auth] callback failed', error)
      return NextResponse.json({ error: 'authentication_failed' }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({ error: 'session_not_created' }, { status: 500 })
    }

    const serverUrl = process.env.SERVER_URL
    if (!serverUrl) {
      console.error('[auth] SERVER_URL is not configured')
      return NextResponse.json({ error: 'server_not_configured' }, { status: 500 })
    }

    try {
      const response = await fetch(`${serverUrl.replace(/\/$/, '')}/api/users/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.tokenSet.accessToken}` },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error('[auth] user provisioning failed with status', response.status)
        return NextResponse.json({ error: 'user_provisioning_failed' }, { status: 502 })
      }
    } catch (provisioningError) {
      console.error('[auth] user provisioning request failed', provisioningError)
      return NextResponse.json({ error: 'user_provisioning_failed' }, { status: 502 })
    }

    if (!context.appBaseUrl) {
      return NextResponse.json({ error: 'app_base_url_not_resolved' }, { status: 500 })
    }

    const returnTo =
      context.returnTo?.startsWith('/') && !context.returnTo.startsWith('//')
        ? context.returnTo
        : '/'

    return NextResponse.redirect(new URL(returnTo, context.appBaseUrl))
  },
})
