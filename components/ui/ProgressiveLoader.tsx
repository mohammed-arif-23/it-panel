'use client'

import { ReactNode } from 'react'

interface ProgressiveLoaderProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  minLoadTime?: number // Minimum time to show skeleton (prevents flash)
  className?: string
}

export default function ProgressiveLoader({
  isLoading,
  skeleton,
  children,
  className = ''
}: ProgressiveLoaderProps) {
  return (
    <div className={className}>
      {isLoading ? skeleton : children}
    </div>
  )
}

// Convenience wrapper for common patterns
export function ProgressiveContent({
  isLoading,
  children,
  skeletonLines = 3
}: {
  isLoading: boolean
  children: ReactNode
  skeletonLines?: number
}) {
  return (
    <ProgressiveLoader
      isLoading={isLoading}
      skeleton={
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: skeletonLines }).map((_, i) => (
            <div
              key={i}
              className={`h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg skeleton ${
                i === skeletonLines - 1 ? 'w-3/4' : 'w-full'
              }`}
            />
          ))}
        </div>
      }
    >
      {children}
    </ProgressiveLoader>
  )
}
