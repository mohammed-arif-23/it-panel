'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Library } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/pwa/PullToRefresh'
import { QPBrowseFlow } from '@/components/qps/QPBrowseFlow'

interface SubjectItem {
  code: string
  name: string
  staff?: string | null
  internal?: string | null
}

interface QPBrowseData {
  department: string
  year: string
  subject: SubjectItem
}

export default function QPsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showFlow, setShowFlow] = useState(true)

  const handleComplete = (data: QPBrowseData) => {
    console.log('QP Browse completed:', data)
    // Could add analytics or user activity tracking here
  }

  const handleCancel = () => {
    setShowFlow(false)
    // Could redirect back to dashboard
  }

  const onRefresh = async () => {
    // Refresh functionality can be handled within the flow components
    setShowFlow(false)
    setTimeout(() => setShowFlow(true), 100)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20" />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2"><Library className="w-5 h-5"/>University QP's</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <PullToRefresh onRefresh={onRefresh}>
        {showFlow ? (
          <QPBrowseFlow onComplete={handleComplete} />
        ) : (
          <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
            <div className="saas-card p-8">
              <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">Question Papers</h2>
              <p className="text-[var(--color-text-muted)] mb-6">
                Browse and download university question papers by department, year, and subject.
              </p>
              <button
                onClick={() => setShowFlow(true)}
                className="saas-button-primary px-6 py-3"
              >
                Browse Question Papers
              </button>
            </div>
          </div>
        )}
      </PullToRefresh>
    </div>
  )
}
