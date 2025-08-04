import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement>
  onEnter?: (activeIndex: number) => void
  onEscape?: () => void
  isEnabled?: boolean
  itemSelector?: string
  autoFocus?: boolean
}

/**
 * Custom hook for keyboard navigation within a container
 * Supports arrow keys, Enter, and Escape
 */
export function useKeyboardNavigation({
  containerRef,
  onEnter,
  onEscape,
  isEnabled = true,
  itemSelector = '[role="option"], button:not(:disabled), [tabindex]:not([tabindex="-1"])',
  autoFocus = false
}: UseKeyboardNavigationOptions) {
  const activeIndexRef = useRef<number>(-1)

  const getNavigableItems = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(itemSelector)) as HTMLElement[]
  }, [itemSelector])

  const setActiveItem = useCallback((index: number) => {
    const items = getNavigableItems()
    if (items.length === 0) return

    // Remove previous focus
    items.forEach(item => {
      item.setAttribute('tabindex', '-1')
      item.classList.remove('keyboard-focus')
    })

    // Set new active index
    const validIndex = Math.max(0, Math.min(index, items.length - 1))
    activeIndexRef.current = validIndex

    // Focus new item
    const activeItem = items[validIndex]
    if (activeItem) {
      activeItem.setAttribute('tabindex', '0')
      activeItem.classList.add('keyboard-focus')
      activeItem.focus()
    }
  }, [getNavigableItems])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled || !containerRef.current) return

    const items = getNavigableItems()
    if (items.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveItem(activeIndexRef.current + 1)
        break

      case 'ArrowUp':
        event.preventDefault()
        setActiveItem(activeIndexRef.current - 1)
        break

      case 'Home':
        event.preventDefault()
        setActiveItem(0)
        break

      case 'End':
        event.preventDefault()
        setActiveItem(items.length - 1)
        break

      case 'Enter':
        event.preventDefault()
        if (activeIndexRef.current >= 0 && onEnter) {
          onEnter(activeIndexRef.current)
        }
        break

      case 'Escape':
        event.preventDefault()
        if (onEscape) {
          onEscape()
        }
        break
    }
  }, [isEnabled, getNavigableItems, setActiveItem, onEnter, onEscape])

  // Initialize keyboard navigation
  useEffect(() => {
    if (!isEnabled || !containerRef.current) return

    const container = containerRef.current
    container.addEventListener('keydown', handleKeyDown)

    // Auto-focus first item if enabled
    if (autoFocus) {
      const items = getNavigableItems()
      if (items.length > 0) {
        setActiveItem(0)
      }
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEnabled, handleKeyDown, autoFocus, getNavigableItems, setActiveItem])

  // Reset active index when items change
  useEffect(() => {
    if (!isEnabled) return
    
    const items = getNavigableItems()
    if (items.length === 0) {
      activeIndexRef.current = -1
    } else if (activeIndexRef.current >= items.length) {
      setActiveItem(items.length - 1)
    }
  }, [isEnabled, getNavigableItems, setActiveItem])

  return {
    activeIndex: activeIndexRef.current,
    setActiveItem,
    getNavigableItems
  }
}

export default useKeyboardNavigation