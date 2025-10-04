'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ProgressiveLoginFlow } from '../components/auth/ProgressiveLoginFlow'
import { SkeletonCard } from '../components/ui/skeletons'
import Image from 'next/image'
import RedirectLoader from '../components/ui/RedirectLoader'

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
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
        {/* Header with Logo */}
        <nav className="sticky top-0 z-50 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="container mx-auto px-4 py-4 flex justify-center">
            <Image 
              src="/logo.png" 
              alt="IT Department Logo" 
              width={400} 
              height={400}
              className="w-full h-full object-contain animate-pulse opacity-70"
              priority
            />
          </div>
        </nav>
        
        {/* Content Skeleton - Matches WelcomeStep Layout */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-3">
              <div className="h-10 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg skeleton animate-pulse mx-auto w-48"></div>
              <div className="h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg skeleton animate-pulse mx-auto w-56"></div>
            </div>
            
            {/* Button Skeleton */}
            <div className="h-14 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg skeleton animate-pulse w-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return <RedirectLoader context="dashboard" />
  }

  return <ProgressiveLoginFlow onLogin={login} />
}
