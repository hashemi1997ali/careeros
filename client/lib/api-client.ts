import { notifyError } from '@/lib/notifications'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function responseMessage(response: Response) {
  if (response.status === 429) {
    return 'Analysis was not successful. Please try again.'
  }

  const contentType = response.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('json')) {
      const body = (await response.json()) as {
      title?: string
      detail?: string
      message?: string
      error?: string
        errors?: Record<string, string[]>
      }

      const validation = body.errors
        ? Object.values(body.errors).flat().filter(Boolean).join(' ')
        : null

      return validation || body.detail || body.message || body.title || body.error || null
    }

    const text = await response.text()
    return text.trim() || null
  } catch {
    return null
  }
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
  })

  if (!response.ok) {
    const message = (await responseMessage(response)) ?? `Request failed (${response.status}).`
    const isAiRequest = typeof input === 'string' && input.includes('/api/ai/')
    const title = isAiRequest && response.status === 503
      ? 'AI unavailable'
      : isAiRequest && response.status >= 500
        ? 'Analysis unavailable'
      : response.status === 429
      ? 'Analysis unavailable'
      : response.status === 502
      ? 'Service unavailable'
      : response.status === 401
        ? 'Session expired'
        : response.status >= 500
          ? 'Server error'
          : 'Request failed'
    notifyError(message, title)
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
