export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function responseMessage(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  try {
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as {
        title?: string
        detail?: string
        error?: string
        errors?: Record<string, string[]>
      }

      const validation = body.errors
        ? Object.values(body.errors).flat().filter(Boolean).join(' ')
        : null

      return validation || body.detail || body.title || body.error || null
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
    throw new ApiError(
      (await responseMessage(response)) ?? `Request failed (${response.status}).`,
      response.status,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
