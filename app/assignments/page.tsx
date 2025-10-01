'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation'
import { useAssignments } from '../../hooks/useAssignments'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import { 
  FileText, 
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Loader from '../../components/ui/loader'
import dynamic from 'next/dynamic'
import LazyLoader from '../../components/ui/LazyLoader'
import { offlineSyncService } from '../../lib/offlineSyncService'
import { SkeletonAssignmentCard, SkeletonStatCard } from '../../components/ui/skeletons'
import ProgressiveLoader from '../../components/ui/ProgressiveLoader'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/animations'
import SwipeableCard, { swipeActions } from '../../components/ui/SwipeableCard'
import PageTransition from '../../components/ui/PageTransition'

// Lazy load heavy components
const AssignmentCard = dynamic(() => import('../../components/assignments/AssignmentCard').then(mod => ({ default: mod.AssignmentCard })), { ssr: false })
const ProgressiveAssignmentSubmission = dynamic(() => import('../../components/assignments/ProgressiveAssignmentSubmission').then(mod => ({ default: mod.ProgressiveAssignmentSubmission })), { ssr: false })

interface Assignment {
  id: string
  title: string
  description: string
  class_year: string
  due_date: string
  created_at: string
}

interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string
  file_name: string
  marks: number | null
  submitted_at: string
  status: 'submitted' | 'graded'
}

interface AssignmentWithSubmission extends Assignment {
  submission?: AssignmentSubmission
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmission | null>(null)

  // Use React Query for assignments data
  const { data: assignments = [], isLoading, refetch } = useAssignments(user?.id || '', user?.class_year || '')

  const handleRefresh = async () => {
    await refetch()
  }

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
  }, [user, router])

  const handleAssignmentClick = useCallback((assignment: AssignmentWithSubmission) => {
    setSelectedAssignment(assignment)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedAssignment(null)
  }, [])

  const handleSuccess = useCallback(async () => {
    await refetch()
  }, [refetch])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    })
  }, [])

  const isOverdue = useCallback((dueDate: string) => {
    return new Date() > new Date(dueDate)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] page-transition pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
            <div className="w-24 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
            <div className="w-16"></div>
          </div>
        </div>

        <div className="px-4 py-6">
          {/* Stats Skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          
          {/* Assignment Cards Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonAssignmentCard key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  // Show progressive submission view if an assignment is selected
  if (selectedAssignment) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] page-transition pb-20">
        <div className="px-4 py-6">
          <LazyLoader minHeight="400px">
            <ProgressiveAssignmentSubmission
              assignment={selectedAssignment}
              studentId={user.id}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          </LazyLoader>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-bold text-[var(--color-primary)]">Assignments</h1>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="saas-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-primary)]">{assignments.length}</div>
            <div className="text-xs text-[var(--color-text-muted)]">Total</div>
          </div>
          <div className="saas-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-success)]">
              {assignments.filter(a => a.submission).length}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Submitted</div>
          </div>
          <div className="saas-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--color-warning)]">
              {assignments.filter(a => !a.submission && !isOverdue(a.due_date)).length}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">Pending</div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonAssignmentCard key={i} />
            ))}
          </div>
        ) : assignments.length === 0 ? (
          <div className="saas-card p-8 text-center">
            <div className="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[var(--color-secondary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">No assignments available</h3>
            <p className="text-[var(--color-text-muted)]">There are currently no assignments for your class.</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  variants={staggerItem}
                  layout
                >
                  {!assignment.submission ? (
                    <SwipeableCard
                      rightAction={{
                        ...swipeActions.complete,
                        action: () => handleAssignmentClick(assignment)
                      }}
                      onSwipeRight={() => handleAssignmentClick(assignment)}
                      threshold={80}
                    >
                      <LazyLoader minHeight="120px">
                        <AssignmentCard
                          assignment={assignment}
                          onClick={() => handleAssignmentClick(assignment)}
                          formatDate={formatDate}
                          isOverdue={isOverdue}
                        />
                      </LazyLoader>
                    </SwipeableCard>
                  ) : (
                    <LazyLoader minHeight="120px">
                      <AssignmentCard
                        assignment={assignment}
                        onClick={() => handleAssignmentClick(assignment)}
                        formatDate={formatDate}
                        isOverdue={isOverdue}
                      />
                    </LazyLoader>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
        </div>
      </div>
      </PageTransition>
    </PullToRefresh>
  )
}