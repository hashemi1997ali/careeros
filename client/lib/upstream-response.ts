import { NextResponse } from 'next/server'

export const upstreamResponse = async (response: Response): Promise<NextResponse> => {
  const hasNoBody = response.status === 204 || response.status === 205 || response.status === 304
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = response.headers.get('content-type')

  if (!hasNoBody && contentType) headers.set('Content-Type', contentType)

  return new NextResponse(hasNoBody ? null : await response.arrayBuffer(), {
    status: response.status,
    headers,
  })
}
