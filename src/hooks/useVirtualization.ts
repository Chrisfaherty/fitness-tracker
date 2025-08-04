import { useState, useEffect, useMemo, useCallback } from 'react'

interface UseVirtualizationOptions {
  itemHeight: number
  containerHeight: number
  items: any[]
  overscan?: number
}

interface VirtualizationResult {
  visibleItems: {
    index: number
    item: any
    style: React.CSSProperties
  }[]
  totalHeight: number
  scrollToIndex: (index: number) => void
  handleScroll: (event: React.UIEvent<HTMLDivElement>) => void
}

/**
 * Custom hook for virtualizing large lists
 * Only renders visible items for better performance
 */
export function useVirtualization({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: UseVirtualizationOptions): VirtualizationResult {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight])

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight)
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    const startIndex = Math.max(0, visibleStart - overscan)
    const endIndex = Math.min(items.length - 1, visibleEnd + overscan)

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      result.push({
        index: i,
        item: items[i],
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight
        }
      })
    }
    return result
  }, [visibleRange, items, itemHeight])

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    setScrollTop(target.scrollTop)
    setScrollElement(target)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    if (scrollElement) {
      const targetScrollTop = index * itemHeight
      scrollElement.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
  }, [scrollElement, itemHeight])

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    handleScroll
  }
}

export default useVirtualization