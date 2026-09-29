'use client'

import { useEffect } from 'react'
import { PageError } from '@/components/page-state'

// Catches unexpected render errors so one broken widget never blanks the whole workspace.
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[workspace] render failed', error) }, [error])
  return <PageError error={error} onRetry={reset} />
}
