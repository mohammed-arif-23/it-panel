"use client"
import Link from 'next/link'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { NotesBrowseFlow } from '@/components/notes/NotesBrowseFlow'
import { useAuth } from '@/contexts/AuthContext'

export default function NotesPage() {
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
            <h1 className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2"><BookOpen className="w-5 h-5"/>Notes</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4">
        <NotesBrowseFlow />
      </div>
    </div>
  )
}
