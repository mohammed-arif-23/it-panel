'use client'

import { ReactNode, useState, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ProgressiveLoaderProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  error?: Error | string | null
  onRetry?: () => void
  timeout?: number // Timeout in ms
  className?: string
}

export default function ProgressiveLoader({
  isLoading,
  skeleton,
  children,
  error,
  onRetry,
  timeout,
  className = ''
}: ProgressiveLoaderProps) {
  const [isTimeout, setIsTimeout] = useState(false)

  useEffect(() => {
    if (timeout && isLoading) {
      const timer = setTimeout(() => {
        setIsTimeout(true)
      }, timeout)

      return () => clearTimeout(timer)
    }
    setIsTimeout(false)
  }, [isLoading, timeout])

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div className="saas-card p-6 text-center border-red-200 bg-red-50">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-red-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-red-700 mb-4">
            {typeof error === 'string' ? error : error.message || 'Failed to load content'}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Timeout state
  if (isTimeout && isLoading) {
    return (
      <div className={className}>
        <div className="saas-card p-6 text-center border-orange-200 bg-orange-50">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-orange-900 mb-2">Taking longer than expected</h3>
          <p className="text-sm text-orange-700 mb-4">
            This is taking a while. Please check your connection.
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    )
  }

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
              className={`h-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg skeleton ${
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
