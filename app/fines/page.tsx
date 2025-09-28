'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFinesData } from '../../hooks/useDashboardData'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { ArrowLeft, IndianRupee, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'
import Loader from '../../components/ui/loader'

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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-16 h-16">
          <Loader />
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button
              variant="ghost"
              asChild
              className="text-gray-600 hover:bg-gray-100 px-2 py-1 h-auto text-sm"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div className="flex flex-col items-end">
              <p className="text-base font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.register_number || "Student"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-gray-100 rounded-lg mb-3">
            <IndianRupee className="h-5 w-5 text-gray-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Fine History
          </h1>
          <p className="text-gray-500 text-sm">
            Track your academic fines and payment status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <Card className="border border-transparent shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3 flex-col justify-center">
                <div className={`p-2 rounded ${totalFines > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  {totalFines > 0 ? (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <div className="flex-1 text-center">
                  <p className="text-lg text-gray-500">Total</p>
                  <p className={`text-md font-semibold ${totalFines > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{totalFines.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fines List */}
        <Card className="border border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-gray-50 py-3 px-4">
            <CardTitle className="flex items-center space-x-2 text-gray-800 text-base">
    
              <span className="font-medium text-center">Fine Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fines.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center p-2 bg-green-50 rounded-full mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">No Fines Found</h3>
                <p className="text-gray-500 text-sm">
                  Great job! You don't have any fines recorded.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {fines.map((fine) => (
                  <FineItem
                    key={fine.id}
                    fine={fine}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        {totalFines > 0 && (
          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="ml-2">
                <h3 className="text-sm font-medium text-amber-800">Payment Information</h3>
                <p className="text-amber-700 text-xs mt-1">
                  Please contact the department office to settle your pending fines. 
                  Keep your register number and fine details handy when making payments.
                </p>
                <div className="mt-2 inline-flex items-center text-xs text-amber-800">
                  <span className="font-medium">Total Pending:</span>
                  <span className="ml-1 font-semibold text-red-600">₹{totalFines.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoized Fine Item Component
const FineItem = memo(({ 
  fine, 
  formatDate, 
  getStatusColor, 
  getStatusIcon 
}: {
  fine: Fine
  formatDate: (dateString: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => React.ReactNode
}) => (
  <div className="p-4 hover:bg-gray-50 transition-colors duration-150">
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className="text-sm font-medium text-gray-900 truncate">{fine.reason || 'Fine'}</h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fine.payment_status)}`}>
            {getStatusIcon(fine.payment_status)}
            <span className="ml-1 capitalize">{fine.payment_status || 'pending'}</span>
          </span>
        </div>
        <div className="flex items-center text-gray-500 text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{formatDate(fine.date_issued || fine.created_at)}</span>
        </div>
      </div>
      {/* Fine amount moved to the right corner */}
      <div className={`px-2.5 py-1 rounded ${getStatusColor(fine.payment_status)}`}>
        <p className="text-sm font-semibold">
          ₹{fine.base_amount?.toFixed(2) || '0.00'}
        </p>
      </div>
    </div>
  </div>
))

FineItem.displayName = 'FineItem'