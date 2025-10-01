'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface SwipeGesturesProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export const SwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = 100,
  disabled = false
}) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setStartY(e.touches[0].clientY);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || !startX) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Better gesture detection: only handle horizontal swipes
    // Require horizontal movement to be at least 2x the vertical movement
    if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 30) {
      e.preventDefault();
      e.stopPropagation();
      setCurrentX(currentX);
      setIsSwiping(true);
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    }
  };

  const handleTouchEnd = () => {
    if (disabled || !startX) return;
    
    const deltaX = currentX - startX;
    const absDeltaX = Math.abs(deltaX);
    
    if (absDeltaX > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
        showSwipeFeedback('Swiped Right');
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
        showSwipeFeedback('Swiped Left');
      }
    }
    
    // Reset state
    setStartX(0);
    setStartY(0);
    setCurrentX(0);
    setIsSwiping(false);
    setSwipeDirection(null);
  };

  const showSwipeFeedback = (message: string) => {
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startX, currentX, disabled]);

  const swipeOffset = isSwiping ? (currentX - startX) * 0.3 : 0;

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Swipe indicators - properly centered */}
      {isSwiping && (
        <>
          {swipeDirection === 'right' && (
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="w-12 h-12 bg-[var(--color-success)] rounded-full flex items-center justify-center shadow-lg">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
          {swipeDirection === 'left' && (
            <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="w-12 h-12 bg-[var(--color-error)] rounded-full flex items-center justify-center shadow-lg">
                <ArrowLeft className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Content with swipe transform */}
      <div 
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
      
      {/* Swipe feedback */}
      {showFeedback && (
        <div className="swipe-feedback show">
          Action completed
        </div>
      )}
    </div>
  );
};
