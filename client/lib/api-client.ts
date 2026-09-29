import { notifyError } from '@/lib/notifications'

/**
 * `unavailable` – the API (or the network to it) could not be reached.
 * `unauthorized` – the session expired.
 * `http` – the API answered with an error.
 */
export type ApiErrorKind = 'unavailable' | 'unauthorized' | 'http'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly kind: ApiErrorKind = 'http',
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError
export const isServerUnavailable = (error: unknown) => isApiError(error) && error.kind === 'unavailable'

const UPSTREAM_HEADER = 'x-careeros-upstream'
const OFFLINE_MESSAGE = 'CareerOS could not reach its server. Check your connection and try again.'

export interface ApiFetchInit extends RequestInit {
  /**
   * Show a toast when the request fails. Defaults to `true` for mutations and `false`
   * for GET requests: page data is reported once, by the page state, not per section.
   */
  notify?: boolean
}

async function responseMessage(response: Response) {
  if (response.status === 429) return 'Analysis was not successful. Please try again.'

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
      const validation = body.errors ? Object.values(body.errors).flat().filter(Boolean).join(' ') : null
      return validation || body.detail || body.message || body.title || body.error || null
    }
    // HTML error pages (e.g. a crashed route) are not useful to show to people.
    if (contentType.includes('html')) return null
    const text = await response.text()
    return text.trim() || null
  } catch {
    return null
  }
}

function errorTitle(url: string, status: number, kind: ApiErrorKind) {
  const isAi = url.includes('/api/ai/')
  const isExtraction = url.includes('/api/ai/application-extract')
  const operation = isExtraction ? 'Application extraction unavailable' : 'Analysis unavailable'
  if (kind === 'unavailable') return 'Server unavailable'
  if (kind === 'unauthorized') return 'Session expired'
  if (isAi && status === 503) return 'AI unavailable'
  if (isExtraction || (isAi && (status >= 500 || status === 429))) return operation
  if (status === 429) return 'Analysis unavailable'
  if (status >= 500) return 'Server error'
  return 'Request failed'
}

export async function apiFetch<T>(input: RequestInfo | URL, init: ApiFetchInit = {}): Promise<T> {
  const { notify, ...requestInit } = init
  const method = (requestInit.method ?? 'GET').toUpperCase()
  const shouldNotify = notify ?? method !== 'GET'
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  let response: Response
  try {
    response = await fetch(input, { credentials: 'include', cache: 'no-store', ...requestInit })
  } catch (cause) {
    // Aborts (unmount, superseded search) are not failures.
    if (requestInit.signal?.aborted || (cause instanceof DOMException && cause.name === 'AbortError')) throw cause
    const error = new ApiError(OFFLINE_MESSAGE, 0, 'unavailable')
    if (shouldNotify) notifyError(error.message, 'Server unavailable')
    throw error
  }

  if (!response.ok) {
    const isAi = url.includes('/api/ai/')
    const kind: ApiErrorKind = response.headers.get(UPSTREAM_HEADER)
      ? 'unavailable'
      : response.status === 401
        ? 'unauthorized'
        : !isAi && (response.status === 502 || response.status === 503 || response.status === 504)
          ? 'unavailable'
          : 'http'
    const message = kind === 'unavailable'
      ? OFFLINE_MESSAGE
      : (await responseMessage(response)) ?? `Request failed (${response.status}).`
    if (shouldNotify) notifyError(message, errorTitle(url, response.status, kind))
    throw new ApiError(message, response.status, kind)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
