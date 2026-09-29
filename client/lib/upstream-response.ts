import { NextResponse } from 'next/server'

/** Set on responses produced when the ASP.NET Core API could not be reached at all. */
export const upstreamStatusHeader = 'x-careeros-upstream'

const DEFAULT_TIMEOUT_MS = 15_000
const AI_TIMEOUT_MS = 90_000

/**
 * `fetch` for server → API calls. Never throws: a refused connection, DNS failure or
 * timeout becomes one consistent 503 that the browser can recognise as "server offline".
 */
export async function upstreamFetch(input: string | URL, init: RequestInit = {}, timeoutMs?: number): Promise<Response> {
  const url = input.toString()
  const timeout = AbortSignal.timeout(timeoutMs ?? (url.includes('/api/ai/') ? AI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS))
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout

  try {
    return await fetch(input, { ...init, signal })
  } catch (error) {
    console.error('[upstream] request failed', url, error)
    return Response.json(
      { title: 'Server unavailable', detail: 'CareerOS could not reach its server. Please try again in a moment.', error: 'upstream_unavailable' },
      { status: 503, headers: { [upstreamStatusHeader]: 'unavailable', 'Cache-Control': 'no-store' } },
    )
  }
}

export const upstreamResponse = async (response: Response): Promise<NextResponse> => {
  const hasNoBody = response.status === 204 || response.status === 205 || response.status === 304
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = response.headers.get('content-type')
  const upstreamStatus = response.headers.get(upstreamStatusHeader)

  if (!hasNoBody && contentType) headers.set('Content-Type', contentType)
  if (upstreamStatus) headers.set(upstreamStatusHeader, upstreamStatus)

  return new NextResponse(hasNoBody ? null : await response.arrayBuffer(), {
    status: response.status,
    headers,
  })
}
