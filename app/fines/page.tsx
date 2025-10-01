'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFinesData } from '../../hooks/useDashboardData'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import { ArrowLeft, IndianRupee, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import Loader from '../../components/ui/loader'
import PageTransition from '../../components/ui/PageTransition'
import { SkeletonCard, SkeletonStatCard } from '../../components/ui/skeletons'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem } from '../../lib/animations'

interface Fine {
  id: string
  student_id: string
  reason: string
  base_amount: number
  date_issued: string
  payment_status: string
  created_at: string
}

export default function FinesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Use React Query for fines data
  const { data: finesData, isLoading } = useFinesData(user?.id || '')
  
  // Memoized calculations
  const { fines, totalFines, paidFines, pendingFines } = useMemo(() => {
    const finesList = finesData?.fines || []
    const sortedFines = finesList.sort((a: Fine, b: Fine) => {
      const dateA = new Date(a.date_issued || a.created_at).getTime();
      const dateB = new Date(b.date_issued || b.created_at).getTime();
      return dateB - dateA;
    });
    
    return {
      fines: sortedFines,
      totalFines: finesData?.stats?.totalFines || 0,
      paidFines: finesData?.stats?.paidFines || 0,
      pendingFines: finesData?.stats?.pendingFines || 0
    }
  }, [finesData])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }
  }, [user, loading, router])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border border-amber-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      default:
        return <AlertTriangle className="h-3 w-3" />
    }
  }, [])

  const handleRefresh = async () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[var(--color-background)] pb-20">
          <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
            <div className="flex items-center justify-between p-4">
              <div className="w-16 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
              <div className="w-24 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
              <div className="w-16"></div>
            </div>
          </div>
          <div className="px-4 py-6">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (loading || !user) {
    return <div>Redirecting...</div>
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
              <h1 className="text-lg font-bold text-[var(--color-primary)]">Fine History</h1>
            </div>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>

        <div className="px-4 py-6">

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="saas-card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{fines.length}</div>
              <div className="text-xs text-[var(--color-text-muted)]">Total Fines</div>
            </div>
            <div className="saas-card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-success)]">
                {fines.filter(f => f.payment_status.toLowerCase() === 'paid').length}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Paid</div>
            </div>
            <div className="saas-card p-4 text-center">
              <div className="text-2xl font-bold text-[var(--color-error)]">
                ₹{totalFines.toFixed(0)}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">Pending</div>
            </div>
          </div>

          {/* Fines List */}
          {fines.length === 0 ? (
            <div className="saas-card p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">No Fines Found</h3>
              <p className="text-[var(--color-text-muted)]">Great job! You don't have any fines recorded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fines.map((fine) => (
                <FineItem
                  key={fine.id}
                  fine={fine}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}

          {/* Payment Information */}
          {totalFines > 0 && (
            <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-900 mb-2">Payment Information</h3>
                  <p className="text-orange-700 text-sm leading-relaxed mb-3">
                    Please contact the department office to settle your pending fines. 
                    Keep your register number and fine details handy when making payments.
                  </p>
              
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </PageTransition>
    </PullToRefresh>
  )
}

// Memoized Fine Item Component
const FineItem = memo(({ 
  fine, 
  formatDate
}: {
  fine: Fine
  formatDate: (dateString: string) => string
}) => {
  const isPaid = fine.payment_status.toLowerCase() === 'paid'
  
  const getStatusColor = () => {
    return isPaid ? 'var(--color-success)' : 'var(--color-error)'
  }

  const getStatusText = () => {
    return isPaid ? 'Paid' : 'Pending'
  }

  return (
    <div className="saas-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <IndianRupee className="w-6 h-6" style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--color-primary)] text-base leading-tight mb-2">
                {fine.reason || 'Fine'}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div 
                  className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
                  style={{ 
                    backgroundColor: getStatusColor() + '20',
                    color: getStatusColor()
                  }}
                >
                  {isPaid ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {getStatusText()}
                </div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[var(--color-text-muted)]">
                <Calendar className="w-3.5 h-3.5" />
                <span>Issued: {formatDate(fine.date_issued || fine.created_at)}</span>
              </div>
            </div>
          </div>
          
          {/* Amount Display */}
          <div className="flex-shrink-0">
            <div 
              className="px-3 py-2 rounded-xl font-bold text-base"
              style={{
                backgroundColor: getStatusColor() + '20',
                color: getStatusColor()
              }}
            >
              ₹{fine.base_amount?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

FineItem.displayName = 'FineItem'