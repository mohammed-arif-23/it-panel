'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ProgressiveLoginFlow } from '../components/auth/ProgressiveLoginFlow'
import { SkeletonCard } from '../components/ui/skeletons'
import Image from 'next/image'

export default function HomePage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Header Skeleton */}
        <nav className="sticky top-0 z-50 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="container mx-auto px-4 py-4 flex justify-center">
            <Image 
              src="/logo.png" 
              alt="IT Department Logo" 
              width={400} 
              height={400}
              className="w-full h-full object-contain opacity-50"
              priority
            />
          </div>
        </nav>
        
        {/* Content Skeleton */}
        <div className="flex items-center justify-center px-4 py-20">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse mx-auto w-2/3"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse mx-auto w-1/2"></div>
            </div>
            <SkeletonCard variant="wide" />
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return <ProgressiveLoginFlow onLogin={login} />
}
