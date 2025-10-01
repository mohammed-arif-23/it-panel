import { useState, useCallback, useRef, TouchEvent } from 'react'

interface SwipeGestureConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  velocityThreshold?: number
}

interface SwipeState {
  isSwiping: boolean
  direction: 'left' | 'right' | 'up' | 'down' | null
  distance: number
}

export function useSwipeGesture(config: SwipeGestureConfig) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3
  } = config

  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    direction: null,
    distance: 0
  })

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const touchCurrent = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }
    touchCurrent.current = {
      x: touch.clientX,
      y: touch.clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return

    const touch = e.touches[0]
    touchCurrent.current = {
      x: touch.clientX,
      y: touch.clientY
    }

    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    // Determine primary direction
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (absX > absY && absX > 10) {
      // Horizontal swipe
      setSwipeState({
        isSwiping: true,
        direction: deltaX > 0 ? 'right' : 'left',
        distance: absX
      })
    } else if (absY > absX && absY > 10) {
      // Vertical swipe
      setSwipeState({
        isSwiping: true,
        direction: deltaY > 0 ? 'down' : 'up',
        distance: absY
      })
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchCurrent.current) return

    const deltaX = touchCurrent.current.x - touchStart.current.x
    const deltaY = touchCurrent.current.y - touchStart.current.y
    const deltaTime = Date.now() - touchStart.current.time

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const velocity = Math.max(absX, absY) / deltaTime

    // Determine if swipe was successful
    if (absX > absY) {
      // Horizontal swipe
      if (absX > threshold || velocity > velocityThreshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }
    } else {
      // Vertical swipe
      if (absY > threshold || velocity > velocityThreshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }
    }

    // Reset state
    setSwipeState({
      isSwiping: false,
      direction: null,
      distance: 0
    })
    touchStart.current = null
    touchCurrent.current = null
  }, [threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}
