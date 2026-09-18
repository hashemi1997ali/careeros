import { NextResponse, type NextRequest } from 'next/server'
import { auth0 } from './lib/auth0'

export async function proxy(request: NextRequest) {
  const baseUrl = process.env.APP_BASE_URL

  if (process.env.NODE_ENV !== 'production' && baseUrl) {
    try {
      const expected = new URL(baseUrl)
      const headerHost = request.headers.get('host')

      if (headerHost !== expected.host && request.nextUrl.host !== expected.host) {
        const target = new URL(
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
          expected.origin,
        )

        if (target.href !== request.url) {
          return NextResponse.redirect(target, 307)
        }
      }
    } catch {
      console.error('[proxy] APP_BASE_URL is not a valid URL')
    }
  }

  return auth0.middleware(request)
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
}
