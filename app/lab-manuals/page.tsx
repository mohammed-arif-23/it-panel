"use client"
import Link from 'next/link'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import { LabManualsBrowseFlow } from '@/components/lab-manuals/LabManualsBrowseFlow'
import { useAuth } from '@/contexts/AuthContext'

export default function LabManualsPage() {
  const { user, loading } = useAuth()
  if (loading || !user) {
    return <div className="min-h-screen bg-[var(--color-background)] pb-20" />
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
            <h1 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2"><FlaskConical className="w-5 h-5"/>Lab Manuals</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <LabManualsBrowseFlow />
      </div>
    </div>
  )
}
