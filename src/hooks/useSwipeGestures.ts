import { useRef, useCallback, useEffect } from 'react'

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  preventScroll?: boolean
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

/**
 * Custom hook for handling swipe gestures on mobile devices
 */
export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventScroll = false
}: SwipeGestureOptions) {
  const touchStartRef = useRef<TouchPoint | null>(null)
  const touchEndRef = useRef<TouchPoint | null>(null)
  const elementRef = useRef<HTMLElement>(null)

  const getTouchPoint = useCallback((touch: Touch): TouchPoint => ({
    x: touch.clientX,
    y: touch.clientY,
    time: Date.now()
  }), [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 1) return
    
    touchStartRef.current = getTouchPoint(e.touches[0])
    touchEndRef.current = null
    
    if (preventScroll) {
      e.preventDefault()
    }
  }, [getTouchPoint, preventScroll])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return
    
    touchEndRef.current = getTouchPoint(e.touches[0])
    
    if (preventScroll) {
      e.preventDefault()
    }
  }, [getTouchPoint, preventScroll])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current || !touchEndRef.current) return

    const startPoint = touchStartRef.current
    const endPoint = touchEndRef.current
    
    const deltaX = endPoint.x - startPoint.x
    const deltaY = endPoint.y - startPoint.y
    const deltaTime = endPoint.time - startPoint.time
    
    // Ignore very slow swipes (> 500ms)
    if (deltaTime > 500) return
    
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    // Determine if this is a horizontal or vertical swipe
    const isHorizontal = absX > absY
    
    if (isHorizontal && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25)
        }
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25)
        }
      }
    } else if (!isHorizontal && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25)
        }
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp()
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(25)
        }
      }
    }
    
    // Reset
    touchStartRef.current = null
    touchEndRef.current = null
    
    if (preventScroll) {
      e.preventDefault()
    }
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, preventScroll])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Use passive listeners for better performance
    const options = { passive: !preventScroll }
    
    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventScroll])

  return { ref: elementRef }
}

export default useSwipeGestures