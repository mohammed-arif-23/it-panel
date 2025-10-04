'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeletons'

export default function NoDueRedirectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }

    // Perform redirect with studentId as query param
    const target = `https://no-due-generator-app.vercel.app/student?stuid=${encodeURIComponent(user.id)}`
    // Small timeout so the user can see the UI before navigating
    const id = setTimeout(() => {
      window.location.href = target
    }, 800)

    return () => clearTimeout(id)
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-32 h-5 bg-gradient-to-r from-purple-100 to-purple-200 rounded skeleton animate-pulse" />
            <div className="w-16" />
          </div>
        </div>
        <div className="p-4">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>No-Due</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <Card className="w-full max-w-lg shadow-2xl border" style={{ 
        backgroundColor: 'var(--color-background)', 
        borderColor: 'var(--color-border-light)' 
      }}>
        <CardHeader className="text-center border-b rounded-t-xl" style={{ 
          background: 'linear-gradient(to right, var(--color-accent), var(--color-background))',
          borderColor: 'var(--color-border-light)'
        }}>
          <CardTitle className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Redirecting to No-Due Portal
          </CardTitle>
          <CardDescription style={{ color: 'var(--color-text-muted)' }}>
            We are preparing your no-due clearance portal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div className="pt-2">
              <Button asChild className="saas-button-primary rounded-xl">
                <Link href="/dashboard">
                  Go back to dashboard
                </Link>
              </Button>
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              If you are not redirected automatically, please check your internet connection.
            </div>
            {user && (
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Ref ID: <span className="font-mono">{user.id}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
