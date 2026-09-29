'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { isApiError } from '@/lib/api-client'

// Retry only failures that can heal on their own (offline server, 5xx) – never 4xx.
const shouldRetry = (failureCount: number, error: unknown) => {
  if (!isApiError(error)) return failureCount < 1
  if (error.kind === 'unauthorized' || (error.status >= 400 && error.status < 500)) return false
  return failureCount < 1
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: shouldRetry,
            retryDelay: attempt => Math.min(800 * 2 ** attempt, 4_000),
          },
          mutations: { retry: 0 },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
