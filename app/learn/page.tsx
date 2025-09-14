'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function LearnRedirectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/')
      return
    }

    // Perform redirect with studentId as query param
    const target = `https://dynamit-learn.vercel.app/?studentId=${encodeURIComponent(user.id)}`
    // Small timeout so the user can see the UI before navigating
    const id = setTimeout(() => {
      window.location.href = target
    }, 800)

    return () => clearTimeout(id)
  }, [user, loading, router])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4" style={{ backgroundColor: '#FFFFFF' }}>
      <Card className="w-full max-w-lg bg-white shadow-2xl border-2 border-gray-200">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 rounded-t-xl">
          <CardTitle className="text-2xl font-bold text-gray-800">Redirecting to Learning App</CardTitle>
          <CardDescription className="text-gray-600">We are preparing your learning experience</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
            <div className="pt-2">
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl">
                <Link href="/">
                  Go back to home
                </Link>
              </Button>
            </div>
            <div className="text-xs text-gray-400">
              If you are not redirected automatically, please check your internet connection.
            </div>
            {user && (
              <div className="text-xs text-gray-500">
                Ref ID: <span className="font-mono">{user.id}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
