import { useState, useEffect } from 'react'

/**
 * Custom hook that debounces a value for a specified delay
 * Useful for search inputs and API calls to prevent excessive requests
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for debouncing callback functions
 * Returns a debounced version of the callback that delays execution
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [callback, delay])

  return (debouncedCallback || callback) as T
}

export default useDebounce