'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0) return;
    setStartY(e.touches[0].clientY);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || window.scrollY > 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const deltaY = currentY - startY;
    const deltaX = currentX - startX;
    
    // Only handle vertical pulls (ignore horizontal swipes)
    // Require vertical movement to be at least 2x the horizontal movement
    if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) * 2 && Math.abs(deltaY) > 10) {
      e.preventDefault();
      e.stopPropagation();
      const pullDistance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(pullDistance);
      setIsPulling(pullDistance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;
    
    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
    setStartX(0);
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
  }, [startY, startX, pullDistance, isPulling, isRefreshing, disabled]);

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to refresh indicator - only show when pulling, not when refreshing */}
      {!isRefreshing && pullDistance > 20 && (
        <div 
          className="fixed top-8 left-1/2 z-50 transition-all duration-200"
          style={{
            transform: `translate(-50%, ${Math.min(pullDistance - 60, 0)}px)`,
            opacity: pullDistance > 20 ? 1 : 0
          }}
        >
          <div className="w-10 h-10 bg-[var(--color-secondary)] rounded-full flex items-center justify-center shadow-lg">
            <RefreshCw 
              className={`w-5 h-5 text-white ${isPulling ? 'rotate-180' : ''}`}
              style={{ transition: 'transform 0.2s ease' }}
            />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        style={{ 
          transform: `translateY(${Math.min(pullDistance * 0.3, 30)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
      
      {/* Refreshing text - only show this during refresh */}
      {isRefreshing && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-[var(--color-secondary)] text-white px-6 py-3 rounded-full text-sm font-medium z-50 shadow-lg bounce-in">
          Refreshing...
        </div>
      )}
    </div>
  );
};
