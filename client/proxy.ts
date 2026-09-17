import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest): NextResponse {
  const baseUrl = process.env.BASE_URL

  if (process.env.NODE_ENV === 'production' || !baseUrl) {
    return NextResponse.next()
  }

  let expected: URL
  try {
    expected = new URL(baseUrl)
  } catch {
    return NextResponse.next()
  }

  const headerHost = request.headers.get('host')

  if (headerHost === expected.host || request.nextUrl.host === expected.host) {
    return NextResponse.next()
  }

  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, expected.origin)

  if (target.href === request.url) {
    return NextResponse.next()
  }

  console.warn(
    `[proxy] host "${headerHost ?? request.nextUrl.host}" is not "${expected.host}" ` +
      `(BASE_URL), redirecting to ${target.href}`,
  )

  return NextResponse.redirect(target, 307)
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
