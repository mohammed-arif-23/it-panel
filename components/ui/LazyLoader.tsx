'use client'

import { Suspense } from 'react'
import Loader from './loader'

interface LazyLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  minHeight?: string
}

export default function LazyLoader({ children, fallback, minHeight = '200px' }: LazyLoaderProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <div className="w-12 h-12">
        <Loader />
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  )
}
