import { NextResponse } from 'next/server'

export const upstreamResponse = async (response: Response): Promise<NextResponse> => {
  const body = await response.arrayBuffer()
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  const contentType = response.headers.get('content-type')

  if (contentType) headers.set('Content-Type', contentType)

  return new NextResponse(body, {
    status: response.status,
    headers,
  })
}
