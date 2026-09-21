import { NextResponse } from 'next/server'

export function GET() {
  const domain = process.env.AUTH0_DOMAIN
  if (!domain) {
    console.error('[auth] AUTH0_DOMAIN is not configured')
    return NextResponse.json({ error: 'auth0_domain_not_configured' }, { status: 500 })
  }

  try {
    if (!/^[a-z0-9.-]+$/i.test(domain)) {
      return NextResponse.json({ error: 'invalid_auth0_domain' }, { status: 500 })
    }
    const accountUrl = new URL(`https://${domain}/u/account`)
    if (accountUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'invalid_auth0_domain' }, { status: 500 })
    }
    return NextResponse.redirect(accountUrl)
  } catch (error) {
    console.error('[auth] AUTH0_DOMAIN is invalid', error)
    return NextResponse.json({ error: 'invalid_auth0_domain' }, { status: 500 })
  }
}
