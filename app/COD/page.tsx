'use client'

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useCODStudent, useCODDashboardData, usePresenterHistory, useCODBooking } from '../../hooks/useCODData'
import { ProgressivePresenterHistory } from '../../components/seminar/ProgressivePresenterHistory'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import Alert from '../../components/ui/alert'
import { PullToRefresh } from '../../components/pwa/PullToRefresh'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Trophy,
  CalendarX,
  Loader2,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { holidayService } from '../../lib/holidayService'
import { codTimingService } from '../../lib/codTimingService'
import Loader from '@/components/ui/loader'
import PageTransition from '../../components/ui/PageTransition'
import { SkeletonCard, SkeletonStatCard } from '../../components/ui/skeletons'

interface TodaySelection {
  student: {
    id: string
    register_number: string
    name: string
    class_year?: string
  }
  selectedAt: string
}

interface TomorrowSelection {
  student: {
    id: string
    register_number: string
    name: string
    class_year?: string
  }
  selectedAt: string
  codDate: string
}

interface Selection {
  id: string
  student_id: string
  cod_date: string
  selected_at: string
}

interface CODStudent {
  id: string
  reg_number: string
  created_at: string
}

interface BookingWindowInfo {
  isOpen: boolean
  timeUntilOpen?: number
  timeUntilClose?: number
  timeUntilSelection?: number
  nextOpenTime?: Date
  selectionTime?: Date
}

interface HolidayInfo {
  isHoliday: boolean
  holidayName?: string
  holidayDate?: string
  rescheduledDate?: string
}

interface RescheduleNotification {
  originalDate: string
  newDate: string
  holidayName: string
  show: boolean
}


const codDbHelpers = {
  async findCODStudentByRegNumber(regNumber: string) {
    const { data, error } = await supabase
      .from('unified_students')
      .select('*')
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async createCODStudent(regNumber: string) {
    // For the unified system, we don't create separate seminar students
    // Instead, we just ensure the student exists in the unified_students table
    // This should already be handled by the auth system
    const { data, error } = await supabase
      .from('unified_students')
      .select('*')
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async getStudentBooking(studentId: string, bookingDate: string) {
    const { data, error } = await supabase
      .from('unified_cod_bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_date', bookingDate)
      .single()
    
    return { data, error }
  },

  async createBooking(studentId: string, bookingDate: string, codTopic?: string) {
    const { data, error } = await (supabase as any)
      .from('unified_cod_bookings')
      .insert([{ 
        student_id: studentId, 
        booking_date: bookingDate,
        cod_topic: codTopic || null
      }])
      .select()
      .single()
    
    return { data, error }
  },

  async getSelectionForDate(codDate: string) {
    const { data, error } = await supabase
      .from('unified_cod_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('cod_date', codDate)
    
    return { data, error }
  },

  async getSelectionsForDate(codDate: string) {
    const { data, error } = await supabase
      .from('unified_cod_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('cod_date', codDate)
    
    return { data, error }
  },

  async getAllSelectionsForStudent(studentId: string) {
    const { data, error } = await supabase
      .from('unified_cod_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('cod_date', { ascending: false })
    
    return { data, error }
  },

  async hasStudentBeenPreviouslySelected(studentId: string) {
    const { data, error } = await supabase
      .from('unified_cod_selections')
      .select('id')
      .eq('student_id', studentId)
      .limit(1)
      .single()
    
    return { hasBeenSelected: !!data && !error, error: error?.code === 'PGRST116' ? null : error }
  },

  async getPreviouslySelectedStudents() {
    const { data, error } = await supabase
      .from('unified_cod_selections')
      .select('student_id')
    
    return { data: data ? [...new Set((data as any[]).map(s => s.student_id))] : [], error }
  }
}

export default function CODPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [windowInfo, setWindowInfo] = useState<BookingWindowInfo>({ isOpen: false })
  const [isBooking, setIsBooking] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [autoSelectionTriggered, setAutoSelectionTriggered] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')
  const [codTopic, setCodTopic] = useState('')
  const [topicError, setTopicError] = useState('')
  const [holidayInfo, setHolidayInfo] = useState<HolidayInfo>({ isHoliday: false })
  const [rescheduleNotification, setRescheduleNotification] = useState<RescheduleNotification | null>(null)
  const [rescheduleNotificationDismissed, setRescheduleNotificationDismissed] = useState(false)
  const [isSelectionInProgress, setIsSelectionInProgress] = useState(false)
  const [isTodayHoliday, setIsTodayHoliday] = useState(false)
  const [todayHolidayInfo, setTodayHolidayInfo] = useState<{ holidayName?: string }>({})

  // Use React Query hooks
  const { data: codStudent, isLoading: isLoadingStudent, refetch: refetchStudent } = useCODStudent(user?.register_number || '')
  const { data: dashboardData, isLoading: isLoadingSelections, refetch: refetchDashboard } = useCODDashboardData(codStudent?.id || '', user?.class_year || '')
  const { data: presenterHistory = [], refetch: refetchHistory } = usePresenterHistory(user?.class_year || '')
  const bookingMutation = useCODBooking()

  const handleRefresh = async () => {
    await Promise.all([
      refetchStudent(),
      refetchDashboard(),
      refetchHistory()
    ])
  }

  // Extract data from dashboard with safe defaults
  const { hasBookedToday, todaySelection, tomorrowSelections = [], nextCODDate } = dashboardData || {}

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
  }, [user, router])

  // Real-time updates with auto-selection and holiday checking
  useEffect(() => {
    const updateWindowInfo = async () => {
      const info = codTimingService.getBookingWindowInfo()
      setWindowInfo(info)
      
      // Check if today is a holiday
      const today = new Date().toISOString().split('T')[0]
      const { isHoliday: isTodayHolidayCheck, holiday: todayHoliday } = await holidayService.isHoliday(today)
      setIsTodayHoliday(isTodayHolidayCheck)
      if (isTodayHolidayCheck && todayHoliday) {
        setTodayHolidayInfo({ holidayName: todayHoliday.holiday_name })
      } else {
        setTodayHolidayInfo({})
      }
      
      // Get holiday-aware next COD date
      const holidayAwareSeminarDate = await holidayService.getHolidayAwareNextSeminarDate()
      
      // Check if the originally calculated COD date is a holiday
      const originalDate = codTimingService.getNextCODDate()
      const { isHoliday, holiday } = await holidayService.isHoliday(originalDate)
      
      if (isHoliday && holiday) {
        setHolidayInfo({
          isHoliday: true,
          holidayName: holiday.holiday_name,
          holidayDate: originalDate,
          rescheduledDate: holidayAwareSeminarDate
        })
        
        // Show reschedule notification if dates are different and not dismissed
        if (originalDate !== holidayAwareSeminarDate && !rescheduleNotificationDismissed) {
          setRescheduleNotification({
            originalDate,
            newDate: holidayAwareSeminarDate,
            holidayName: holiday.holiday_name,
            show: true
          })
        }
      } else {
        setHolidayInfo({ isHoliday: false })
        // Reset notification if no holiday
        setRescheduleNotification(null)
        setRescheduleNotificationDismissed(false)
      }
      
      // Check if we should trigger auto-selection
      if (codTimingService.shouldTriggerAutoSelection() && !autoSelectionTriggered) {
        setAutoSelectionTriggered(true)
        setIsSelectionInProgress(true)
        setSelectionMessage('Triggering automatic selection...')
        
        try {
          const result = await codTimingService.triggerAutoSelection()
          if (result.success) {
            setSelectionMessage('Automatic selection completed successfully!')
          } else {
            setSelectionMessage(`Selection failed: ${result.message}`)
          }
        } catch (error) {
          // Auto-selection error - handling silently
          setSelectionMessage('Failed to trigger automatic selection')
        } finally {
          setIsSelectionInProgress(false)
        }
      }
      
      // Check if selection time has passed to reset the flag
      if (windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection <= 0) {
        setIsSelectionInProgress(false)
      }
    }

    updateWindowInfo()
    const interval = setInterval(updateWindowInfo, 1000)
    return () => clearInterval(interval)
  }, [autoSelectionTriggered, codStudent, rescheduleNotificationDismissed])

  // Remove old data loading functions since we're using React Query now

  const handleBooking = useCallback(async () => {
    if (!codStudent || !windowInfo.isOpen) return

    setIsBooking(true)
    setBookingMessage('')
    setTopicError('')

    // Validate COD topic
    if (!codTopic.trim()) {
      setTopicError('Please enter your Concept of the Day topic')
      setIsBooking(false)
      return
    }

    try {
      const bookingDate = nextCODDate || await holidayService.getHolidayAwareNextSeminarDate()
      
      await bookingMutation.mutateAsync({
        studentId: codStudent.id,
        bookingDate,
        codTopic
      })
      
      const dateDisplay = codTimingService.formatDateWithDay(bookingDate).split(',')[0]
      setBookingMessage(`Successfully booked for COD on ${dateDisplay}!`)
    } catch (error) {
      setBookingMessage(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }, [codStudent, windowInfo.isOpen, codTopic, nextCODDate, bookingMutation])

  if (isLoadingStudent) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <div className="w-16 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
            <div className="w-48 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded skeleton animate-pulse" />
            <div className="w-16"></div>
          </div>
        </div>
        <div className="p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SkeletonCard variant="wide" />
            </div>
            <div className="space-y-6">
              <SkeletonStatCard />
              <SkeletonStatCard />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <PageTransition>
      <div className="min-h-screen bg-[var(--color-background)] pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-bold text-[var(--color-primary)]">Concept of the Day Booking</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          
          {/* Holiday Reschedule Notification */}
          {rescheduleNotification && rescheduleNotification.show && (
            <div className="saas-card bg-orange-50 border-orange-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CalendarX className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-orange-800 mb-1">COD Rescheduled</h3>
                    <p className="text-sm text-orange-700 mb-2">
                      Due to <strong>{rescheduleNotification.holidayName}</strong>, your COD has been moved:
                    </p>
                    <div className="space-y-1 text-xs text-orange-600">
                      <div>
                        From: {new Date(rescheduleNotification.originalDate + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="font-semibold">
                        To: {new Date(rescheduleNotification.newDate + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRescheduleNotification(null)
                        setRescheduleNotificationDismissed(true)
                      }}
                      className="mt-3 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors"
                    >
                      Got it!
                    </button>
                  </div>
                </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Window Status */}
              <div className="saas-card p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                    <Clock className="h-5 w-5 text-[var(--color-secondary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--color-primary)]">Booking Window</h2>
                </div>
                  {/* Holiday Pause Message */}
                  {isTodayHoliday && (
                    <div className="bg-orange-50 rounded-lg p-4 mb-4 border border-orange-200">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <CalendarX className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="font-semibold text-orange-900">Booking Paused</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-orange-800">
                          Holiday: {todayHolidayInfo.holidayName || 'Holiday'}
                        </p>
                        <p className="text-orange-700">
                          Next COD: {nextCODDate ? codTimingService.formatDateWithDay(nextCODDate).split(',')[0] : 'Next working day'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!isTodayHoliday && windowInfo.isOpen ? (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="font-semibold text-green-900">Window OPEN</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-green-800 font-medium text-sm">
                          Time remaining: {windowInfo.timeUntilClose ? codTimingService.formatTimeRemaining(windowInfo.timeUntilClose) : 'Unknown'}
                        </p>
                        {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                          <p className="text-[var(--color-secondary)] font-medium text-sm">
                            Selection in: {codTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                          </p>
                        )}
                      </div>
                      
                      {hasBookedToday ? (
                        <Alert 
                          variant="info" 
                          message={`You already have an active booking for the COD on ${nextCODDate ? codTimingService.formatDateWithDay(nextCODDate).split(',')[0] : 'the next date'}.`}
                          className="mb-4"
                        />
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-[var(--color-primary)] mb-2">
                              Concept of the Day Topic
                            </label>
                            <input
                              type="text"
                              required
                              value={codTopic}
                              onChange={(e) => {
                                setCodTopic(e.target.value)
                                if (topicError && e.target.value.trim()) {
                                  setTopicError('')
                                }
                              }}
                              className={`w-full px-4 py-3 border-2 ${topicError ? 'border-red-300 focus:border-red-500' : 'border-[var(--color-accent)] focus:border-[var(--color-secondary)]'} rounded-lg focus:outline-none bg-white text-[var(--color-primary)] transition-colors`}
                              placeholder="Enter your concept topic"
                            />
                            {topicError && (
                              <p className="mt-2 text-sm text-red-600">{topicError}</p>
                            )}
                          </div>
                          
                          <button
                            onClick={handleBooking}
                            disabled={isBooking}
                            className="w-full bg-[var(--color-secondary)] hover:bg-[var(--color-dark)] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBooking ? (
                              <>
                                <Loader /> 
                                <span>Booking...</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="h-5 w-5" />
                                <span>Book Seminar</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {bookingMessage && (
                        <Alert 
                          variant={bookingMessage.includes('Successfully') ? 'success' : bookingMessage.includes('already booked') ? 'info' : 'error'} 
                          message={bookingMessage} 
                          className="mt-4"
                          onClose={() => setBookingMessage('')}
                        />
                      )}
                    </div>
                  ) : !isTodayHoliday ? (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="font-semibold text-red-900">Window CLOSED</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-red-800 font-medium text-sm">
                          Opens in: {windowInfo.timeUntilOpen ? codTimingService.formatTimeRemaining(windowInfo.timeUntilOpen) : 'Unknown'}
                        </p>
                        {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                          <p className="text-[var(--color-secondary)] font-medium text-sm">
                            Selection in: {codTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
              </div>
            </div>
            <div className="space-y-6">
              {/* Today's Selection */}
              <div className="saas-card p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                    <Trophy className="h-5 w-5 text-[var(--color-secondary)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-primary)]">Today's Selection</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.class_year || 'Your Class'}</p>
                  </div>
                </div>
                  {isLoadingSelections ? (
                    <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-green-600 mb-3" />
                      <p className="text-sm text-green-600 font-medium">Lets see who is selected next...</p>
                    </div>
                  ) : todaySelection ? (
                    <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-3">
                          <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3">
                          SELECTED TODAY
                        </div>
                        <h3 className="font-bold text-green-900 text-lg mb-2">
                          {todaySelection.student.name}
                        </h3>
                        <p className="text-green-800 text-sm mb-1">
                          {todaySelection.student.register_number}
                        </p>
                        <p className="text-green-700 text-xs">
                          {todaySelection.student.class_year || 'IT Department'}
                        </p>
                        <p className="text-green-600 text-xs mt-3">
                          {codTimingService.formatDateWithDay(codTimingService.getTodayDate()).split(',')[0]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                        <User className="h-10 w-10 mx-auto text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-2">No student from {user?.class_year || 'your class'} selected today</p>
                      <p className="text-xs text-gray-400">
                        Selection will happen at {codTimingService.getBookingWindowConfig().selectionTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Selection */}
              <div className="saas-card p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                    <Trophy className="h-5 w-5 text-[var(--color-secondary)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--color-primary)]">Next Selection</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.class_year || 'Your Class'}</p>
                  </div>
                </div>
                  {isLoadingSelections ? (
                    <div className="text-center py-8 bg-[var(--color-accent)] rounded-lg border border-[var(--color-secondary)]/20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-[var(--color-secondary)] mb-3" />
                      <p className="text-sm text-[var(--color-secondary)] font-medium">Selection in progress...</p>
                    </div>
                  ) : tomorrowSelections.length > 0 ? (
                    <div className="space-y-3">
                      {tomorrowSelections.map((selection, index) => (
                        <div key={index} className="bg-[var(--color-accent)] rounded-lg p-4 border border-[var(--color-secondary)]/20">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-3">
                              <div className="p-2 bg-[var(--color-secondary)]/10 rounded-full">
                                <Trophy className="h-5 w-5 text-[var(--color-secondary)]" />
                              </div>
                            </div>
                            <div className="bg-[var(--color-secondary)] text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-2">
                              NEXT PRESENTER
                            </div>
                            <h3 className="font-bold text-[var(--color-primary)] mb-1">
                              {selection.student.name}
                            </h3>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-1">
                              {selection.student.register_number}
                            </p>
                            <p className="text-[var(--color-text-muted)] text-xs">
                              {selection.student.class_year || 'IT Department'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                        <User className="h-10 w-10 mx-auto text-gray-400" />
                      </div>
                      <p className="text-sm font-medium mb-2">No student from {user?.class_year || 'your class'} selected for tomorrow</p>
                      <p className="text-xs text-gray-400">
                        Selection will happen at {codTimingService.getBookingWindowConfig().selectionTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Next COD */}
              <div className="saas-card p-5">
                <div className="flex items-center space-x-3 mb-5">
                  <div className="p-2 bg-[var(--color-accent)] rounded-lg">
                    <Calendar className="h-5 w-5 text-[var(--color-secondary)]" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-primary)]">Next COD</h3>
                </div>
                  <div className="text-center bg-[var(--color-accent)]/50 rounded-lg p-5 border border-[var(--color-secondary)]/20">
                    <p className="text-[var(--color-primary)] font-bold text-lg mb-2">
                      {nextCODDate ? codTimingService.formatDateWithDay(nextCODDate) : 'Loading...'}
                    </p>
                    <p className="text-[var(--color-text-secondary)] text-sm font-medium">
                      Selection at {codTimingService.getBookingWindowConfig().selectionTime}
                    </p>
                    
                    {/* Holiday Information */}
                    {holidayInfo.isHoliday && holidayInfo.rescheduledDate && holidayInfo.holidayDate !== holidayInfo.rescheduledDate && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Info className="h-4 w-4 text-orange-600" />
                          <span className="text-xs font-medium text-orange-800">Holiday Adjustment</span>
                        </div>
                        <p className="text-xs text-orange-700">
                          Originally {codTimingService.formatDateWithDay(holidayInfo.holidayDate || '')} ({holidayInfo.holidayName})
                        </p>
                        <p className="text-xs text-orange-600 font-medium">
                          Rescheduled to above date
                        </p>
                      </div>
                    )}
                  </div>
                </div>

          {/* Progressive Presenter History */}
          <ProgressivePresenterHistory 
            presenterHistory={presenterHistory.map(p => ({ ...p, seminarDate: p.codDate }))} 
            isLoading={isLoadingSelections} 
            classYear={user?.class_year || 'Your Class'} 
          />
        </div>
      </div>
      </PageTransition>
    </PullToRefresh>
  )
}
