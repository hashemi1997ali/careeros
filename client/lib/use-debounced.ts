import { useEffect, useState } from 'react'

/** `value`, updated only after it has stopped changing for `delay` ms (search boxes that hit the API). */
export function useDebounced<T>(value: T, delay = 250) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return settled
}
