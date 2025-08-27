'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import Alert from '../../components/ui/alert'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowLeft,
  Trophy,
  Loader2,
  RefreshCw,
  CalendarX,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { holidayService } from '../../lib/holidayService'
import { seminarTimingService } from '../../lib/seminarTimingService'

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
  seminarDate: string
}

interface Selection {
  id: string
  student_id: string
  seminar_date: string
  selected_at: string
}

interface SeminarStudent {
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


const seminarDbHelpers = {
  async findSeminarStudentByRegNumber(regNumber: string) {
    const { data, error } = await supabase
      .from('unified_students')
      .select('*')
      .eq('register_number', regNumber)
      .single()
    
    return { data, error }
  },

  async createSeminarStudent(regNumber: string) {
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
      .from('unified_seminar_bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('booking_date', bookingDate)
      .single()
    
    return { data, error }
  },

  async createBooking(studentId: string, bookingDate: string, seminarTopic?: string) {
    const { data, error } = await (supabase as any)
      .from('unified_seminar_bookings')
      .insert([{ 
        student_id: studentId, 
        booking_date: bookingDate,
        seminar_topic: seminarTopic || null
      }])
      .select()
      .single()
    
    return { data, error }
  },

  async getSelectionForDate(seminarDate: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('seminar_date', seminarDate)
    
    return { data, error }
  },

  async getSelectionsForDate(seminarDate: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select(`
        *,
        unified_students(*)
      `)
      .eq('seminar_date', seminarDate)
    
    return { data, error }
  },

  async getAllSelectionsForStudent(studentId: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false })
    
    return { data, error }
  },

  async hasStudentBeenPreviouslySelected(studentId: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('id')
      .eq('student_id', studentId)
      .limit(1)
      .single()
    
    return { hasBeenSelected: !!data && !error, error: error?.code === 'PGRST116' ? null : error }
  },

  async getPreviouslySelectedStudents() {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('student_id')
    
    return { data: data ? [...new Set((data as any[]).map(s => s.student_id))] : [], error }
  }
}

export default function SeminarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [seminarStudent, setSeminarStudent] = useState<SeminarStudent | null>(null)
  const [windowInfo, setWindowInfo] = useState<BookingWindowInfo>({ isOpen: false })
  const [todaySelection, setTodaySelection] = useState<TodaySelection | null>(null)
  const [tomorrowSelections, setTomorrowSelections] = useState<TomorrowSelection[]>([])
  const [hasBookedToday, setHasBookedToday] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSelections, setIsLoadingSelections] = useState(false)
  const [autoSelectionTriggered, setAutoSelectionTriggered] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')
  const [seminarTopic, setSeminarTopic] = useState('')
  const [topicError, setTopicError] = useState('')
  const [holidayInfo, setHolidayInfo] = useState<HolidayInfo>({ isHoliday: false })
  const [rescheduleNotification, setRescheduleNotification] = useState<RescheduleNotification | null>(null)
  const [rescheduleNotificationDismissed, setRescheduleNotificationDismissed] = useState(false)
  const [nextSeminarDate, setNextSeminarDate] = useState('')
  const [isSelectionInProgress, setIsSelectionInProgress] = useState(false)
  const [presenterHistory, setPresenterHistory] = useState<TomorrowSelection[]>([])
  const [isTodayHoliday, setIsTodayHoliday] = useState(false)
  const [todayHolidayInfo, setTodayHolidayInfo] = useState<{ holidayName?: string }>({})

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    initializeSeminarStudent()
  }, [user, router])

  // Real-time updates with auto-selection and holiday checking
  useEffect(() => {
    const updateWindowInfo = async () => {
      const info = seminarTimingService.getBookingWindowInfo()
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
      
      // Get holiday-aware next seminar date
      const holidayAwareSeminarDate = await holidayService.getHolidayAwareNextSeminarDate()
      setNextSeminarDate(holidayAwareSeminarDate)
      
      // Check if the originally calculated seminar date is a holiday
      const originalDate = seminarTimingService.getNextSeminarDate()
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
      if (seminarTimingService.shouldTriggerAutoSelection() && !autoSelectionTriggered) {
        setAutoSelectionTriggered(true)
        setIsSelectionInProgress(true)
        setSelectionMessage('Triggering automatic selection...')
        
        try {
          const result = await seminarTimingService.triggerAutoSelection()
          if (result.success) {
            setSelectionMessage('Automatic selection completed successfully!')
            // Reload dashboard data to show the new selection
            if (seminarStudent) {
              loadDashboardData()
            }
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
  }, [autoSelectionTriggered, seminarStudent, rescheduleNotificationDismissed])

  // Load data when seminar student is set
  useEffect(() => {
    if (seminarStudent) {
      loadDashboardData()
    }
  }, [seminarStudent])

  const initializeSeminarStudent = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Check if seminar student exists
      let { data: student, error } = await seminarDbHelpers.findSeminarStudentByRegNumber(user.register_number)

      if (error && error.code !== 'PGRST116') {
        // Database error - handling silently
        return
      }

      // If seminar student doesn't exist, create one
      if (!student) {
        const createResult = await seminarDbHelpers.createSeminarStudent(user.register_number)
        if (createResult.error) {
          // Error creating seminar student - handling silently
          return
        }
        student = createResult.data
      }

      setSeminarStudent(student)
    } catch (error) {
      // Error initializing seminar student - handling silently
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!seminarStudent) return

    setIsLoadingSelections(true)
    try {
      // Get holiday-aware next seminar date
      const holidayAwareDate = nextSeminarDate || await holidayService.getHolidayAwareNextSeminarDate()
      
      // Check if user has booked for next seminar
      const { data: booking } = await seminarDbHelpers.getStudentBooking(seminarStudent.id, holidayAwareDate)
      setHasBookedToday(!!booking)

      // Get date references for selection lookup
      const today = seminarTimingService.getTodayDate()
      const tomorrow = seminarTimingService.getNextSeminarDate()

      // Try to find selections for multiple possible dates
      const datesToCheck = [holidayAwareDate, tomorrow, today]
      let foundSelections = null
      let foundSelectionsDate = null

      // Check each date until we find selections
      for (const dateToCheck of datesToCheck) {
        const { data: selections } = await seminarDbHelpers.getSelectionsForDate(dateToCheck)
        if (selections && selections.length > 0) {
          foundSelections = selections
          foundSelectionsDate = dateToCheck
          break
        }
      }

      // Process today's selection from found selections
      if (foundSelections && foundSelections.length > 0) {
        // Find selections from the user's class only
        const userClassSelections = foundSelections.filter((selection: any) => 
          (selection as any).unified_students.class_year === user?.class_year
        )
        
        if (userClassSelections.length > 0) {
          // Sort by selection time (most recent first) and show the latest
          const sortedSelections = userClassSelections.sort((a: any, b: any) => 
            new Date((b as any).selected_at).getTime() - new Date((a as any).selected_at).getTime()
          )
          
          const latestSelection = sortedSelections[0]
          
          setTodaySelection({
            student: {
              id: (latestSelection as any).unified_students.id,
              register_number: (latestSelection as any).unified_students.register_number,
              name: (latestSelection as any).unified_students.name || (latestSelection as any).unified_students.register_number,
              class_year: (latestSelection as any).unified_students.class_year
            },
            selectedAt: (latestSelection as any).selected_at
          })
        } else {
          setTodaySelection(null)
        }

        // Set tomorrow's selections (same as today since they're for the same seminar date)
        const allSelections = foundSelections.map((selection: any) => ({
          student: {
            id: selection.unified_students.id,
            register_number: selection.unified_students.register_number,
            name: selection.unified_students.name || selection.unified_students.register_number,
            class_year: selection.unified_students.class_year
          },
          selectedAt: selection.selected_at,
          seminarDate: foundSelectionsDate || holidayAwareDate
        }))
        
        // Filter selections to only show students from the same class as logged-in user
        const filteredSelections = user ? allSelections.filter((selection: any) => 
          selection.student.class_year === user.class_year
        ) : allSelections
        
        // Sort by selection time (most recent first) and show the latest selected student
        const sortedSelections = filteredSelections.sort((a: any, b: any) => 
          new Date(b.selectedAt).getTime() - new Date(a.selectedAt).getTime()
        )
        
        // Show only the most recently selected student from the user's class
        setTomorrowSelections(sortedSelections.slice(0, 1) as TomorrowSelection[])
        
        // Load presenter history (all past selections from user's class)
        await loadPresenterHistory()
      } else {
        setTodaySelection(null)
        setTomorrowSelections([])
        
        // Still load history even if no current selections
        await loadPresenterHistory()
      }
    } catch (error) {
      // Error loading dashboard data - handling silently
    } finally {
      setIsLoadingSelections(false)
    }
  }

  const loadPresenterHistory = async () => {
    if (!user) return

    try {
      // Get all past selections from user's class, ordered by date (most recent first)
      const { data: allSelections, error } = await (supabase as any)
        .from('unified_seminar_selections')
        .select(`
          *,
          unified_students (
            id,
            name,
            register_number,
            class_year
          )
        `)
        .eq('unified_students.class_year', user.class_year)
        .order('seminar_date', { ascending: false })
        .order('selected_at', { ascending: false })
        .limit(20) // Limit to last 20 presentations

      if (error) {
        // Error loading presenter history - handling silently
        return
      }

      if (allSelections && allSelections.length > 0) {
        const historySelections = allSelections
          .filter((selection: any) => selection.unified_students) // Filter out null students
          .map((selection: any) => ({
            student: {
              id: selection.unified_students.id,
              register_number: selection.unified_students.register_number,
              name: selection.unified_students.name || selection.unified_students.register_number,
              class_year: selection.unified_students.class_year
            },
            selectedAt: selection.selected_at,
            seminarDate: selection.seminar_date
          }))

        setPresenterHistory(historySelections as TomorrowSelection[])
      } else {
        setPresenterHistory([])
      }
    } catch (error) {
      // Error loading presenter history - handling silently
      setPresenterHistory([])
    }
  }

  const handleBooking = async () => {
    if (!seminarStudent || !windowInfo.isOpen) return

    setIsBooking(true)
    setBookingMessage('')
    setTopicError('')

    // Validate seminar topic
    if (!seminarTopic.trim()) {
      setTopicError('Please enter your seminar topic')
      setIsBooking(false)
      return
    }

    try {
      const bookingDate = nextSeminarDate || await holidayService.getHolidayAwareNextSeminarDate()
      const { data, error } = await seminarDbHelpers.createBooking(seminarStudent.id, bookingDate, seminarTopic)
      
      if (error) {
        if (error.code === '23505') {
          setBookingMessage(`You have already booked for the seminar on ${seminarTimingService.formatDateWithDay(bookingDate).split(',')[0]}!`)
          setHasBookedToday(true)
        } else {
          setBookingMessage('Failed to book. Please try again.')
        }
      } else {
        const dateDisplay = seminarTimingService.formatDateWithDay(bookingDate).split(',')[0]
        setBookingMessage(`Successfully booked for seminar on ${dateDisplay}!`)
        setHasBookedToday(true)
      }
    } catch (error) {
      console.error('Booking error:', error)
      setBookingMessage('An error occurred. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-black">Loading Seminar system...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      {/* Header with Back Button */}
      <div className="backdrop-blur-md border-b bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button variant="ghost" asChild className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300  hover:shadow-xl rounded-xl px-6 py-3 borderhover:border-blue-300">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 mr-2" />
              
              </Link>
            </Button>
            <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3 ">
              <p className="text-xl font-bold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 font-medium">{user.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl  p-2 mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Seminar Booking</h1>
            <p className="text-gray-600 text-sm">Book your seminar slots and track your selections</p>
          </div>
        </div>
        
        {/* Holiday Reschedule Notification */}
        {rescheduleNotification && rescheduleNotification.show && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <CalendarX className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-orange-800">Seminar Rescheduled Due to Holiday</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    The seminar originally scheduled for {new Date(rescheduleNotification.originalDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} has been moved to {new Date(rescheduleNotification.newDate + 'T12:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} due to <strong>{rescheduleNotification.holidayName}</strong>.
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        setRescheduleNotification(null)
                        setRescheduleNotificationDismissed(true)
                      }}
                    >
                      Got it!
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Window Status */}
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">Booking Window</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Holiday Pause Message */}
                {isTodayHoliday && (
                  <div className="bg-orange-50/60 backdrop-blur-sm border-2 border-orange-200 rounded-xl p-6 shadow-lg mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <CalendarX className="h-6 w-6 text-orange-600" />
                      </div>
                      <span className="font-bold text-orange-800 text-lg">Booking Paused - Holiday</span>
                    </div>
                    <div className="space-y-3">
                      <p className="text-orange-700 font-medium">
                        Seminar booking is paused today due to {todayHolidayInfo.holidayName || 'holiday'}.
                      </p>
                      <p className="text-orange-600 text-sm">
                        Booking will resume on the next working day. Next seminar is scheduled for {nextSeminarDate ? seminarTimingService.formatDateWithDay(nextSeminarDate) : 'the next working day'}.
                      </p>
                    </div>
                  </div>
                )}
                
                {!isTodayHoliday && windowInfo.isOpen ? (
                  <div className="bg-green-50/60 backdrop-blur-sm border-2 border-green-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="font-bold text-green-800 text-lg">Booking Window is OPEN</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      <p className="text-green-700 font-medium">
                        Time remaining: {windowInfo.timeUntilClose ? seminarTimingService.formatTimeRemaining(windowInfo.timeUntilClose) : 'Unknown'}
                      </p>
                      {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                        <p className="text-blue-700 font-medium">
                          Selection in: {seminarTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                        </p>
                      )}
                    </div>
                    
                    {hasBookedToday ? (
                      <Alert 
                        variant="success" 
                        title="Booking Confirmed!" 
                        message={`You have successfully booked for the seminar on ${nextSeminarDate ? seminarTimingService.formatDateWithDay(nextSeminarDate).split(',')[0] : 'the next seminar date'}!`}
                        className="mb-4"
                      />
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3">
                              Seminar Topic Title
                            </label>
                            <input
                              type="text"
                              required
                              value={seminarTopic}
                              onChange={(e) => {
                                setSeminarTopic(e.target.value)
                                if (topicError && e.target.value.trim()) {
                                  setTopicError('')
                                }
                              }}
                              className={`w-full px-4 py-4 border-2 ${topicError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white/70 backdrop-blur-sm shadow-inner text-gray-800 font-medium`}
                              placeholder="Enter your seminar topic title"
                            />
                            {topicError && (
                              <Alert 
                                variant="error" 
                                message={topicError} 
                                className="mt-3"
                              />
                            )}
                          </div>
                          
                          <Button
                            onClick={handleBooking}
                            disabled={isBooking}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
                          >
                            {isBooking ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin mr-3" />
                                Booking...
                              </>
                            ) : (
                              <>  
                                <Calendar className="h-5 w-5 mr-3" />
                                Book Next Seminar
                              </>
                            )}
                          </Button>
                        </div>
                      </>
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
                  <div className="bg-red-50/60 backdrop-blur-sm border-2 border-red-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="h-6 w-6 text-red-500" />
                      </div>
                      <span className="font-bold text-red-800 text-lg">Booking Window is CLOSED</span>
                    </div>
                    <div className="space-y-3">
                      <p className="text-red-700 font-medium">
                        Next opens in: {windowInfo.timeUntilOpen ? seminarTimingService.formatTimeRemaining(windowInfo.timeUntilOpen) : 'Unknown'}
                      </p>
                      {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                        <p className="text-blue-700 font-medium">
                          Selection in: {seminarTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {/* Today's Selection */}
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-green-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">Today's Selection ({user?.class_year || 'Your Class'})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingSelections ? (
                  <div className="text-center py-8 bg-green-50/60 backdrop-blur-sm rounded-xl border-2 border-green-200">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-green-600 mb-3" />
                    <p className="text-sm text-green-600 font-medium">Loading today's selection...</p>
                  </div>
                ) : todaySelection ? (
                  <div className="bg-green-50/70 backdrop-blur-sm border-2 border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">
                          SELECTED TODAY
                        </span>
                      </div>
                      <h3 className="font-bold text-green-900 text-xl mb-2">
                        {todaySelection.student.name}
                      </h3>
                      <p className="text-green-700 text-sm font-medium mb-2 bg-green-100 rounded-lg px-3 py-1 inline-block">
                        {todaySelection.student.register_number}
                      </p>
                      <p className="text-green-700 text-sm font-medium mb-3 bg-green-100/50 rounded-lg px-3 py-1 inline-block">
                        {todaySelection.student.class_year || 'IT Department'}
                      </p>
                      <p className="text-green-600 text-sm font-medium">
                        Selected at: {seminarTimingService.formatTime12Hour(new Date(todaySelection.selectedAt))}
                      </p>
                      <p className="text-green-500 text-xs mt-2">
                        Will present on {nextSeminarDate ? seminarTimingService.formatDateWithDay(nextSeminarDate).split(',')[0] : 'next seminar day'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 bg-gray-50/60 backdrop-blur-sm rounded-xl border-2 border-gray-200">
                    <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                      <User className="h-10 w-10 mx-auto text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mb-2">No student from {user?.class_year || 'your class'} selected today</p>
                    <p className="text-xs text-gray-400">
                      Selection will happen at {seminarTimingService.getBookingWindowConfig().selectionTime}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-blue-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">Next Seminar</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center bg-blue-50/60 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-200 shadow-inner">
                  <p className="text-blue-900 font-bold text-lg mb-2">
                    {nextSeminarDate ? seminarTimingService.formatDateWithDay(nextSeminarDate) : 'Loading...'}
                  </p>
                  <p className="text-blue-700 text-sm font-medium">
                    Selection at {seminarTimingService.getBookingWindowConfig().selectionTime}
                  </p>
                  
                  {/* Holiday Information */}
                  {holidayInfo.isHoliday && holidayInfo.rescheduledDate && holidayInfo.holidayDate !== holidayInfo.rescheduledDate && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Info className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-800">Holiday Adjustment</span>
                      </div>
                      <p className="text-xs text-orange-700">
                        Originally {seminarTimingService.formatDateWithDay(holidayInfo.holidayDate || '')} ({holidayInfo.holidayName})
                      </p>
                      <p className="text-xs text-orange-600 font-medium">
                        Rescheduled to above date
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          

            {/* Presenter History */}
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-purple-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">Presenter History ({user?.class_year || 'Your Class'})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingSelections ? (
                  <div className="text-center py-8 bg-purple-50/60 backdrop-blur-sm rounded-xl border-2 border-purple-200">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-600 mb-3" />
                    <p className="text-sm text-purple-600 font-medium">Loading history...</p>
                  </div>
                ) : presenterHistory.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-50">
                    {presenterHistory.map((selection, index) => {
                      const isUpcoming = new Date(selection.seminarDate) > new Date()
                      const isPast = new Date(selection.seminarDate) < new Date()
                      
                      return (
                        <div key={index} className={`backdrop-blur-sm border-2 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 ${
                          isUpcoming 
                            ? 'bg-blue-50/70 border-blue-200' 
                            : isPast 
                            ? 'bg-gray-50/70 border-gray-200' 
                            : 'bg-purple-50/70 border-purple-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {isUpcoming ? (
                                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded-full">
                                    UPCOMING
                                  </span>
                                ) : isPast ? (
                                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                    COMPLETED
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-1 rounded-full">
                                    TODAY
                                  </span>
                                )}
                              </div>
                              <h4 className={`font-bold text-lg mb-1 ${
                                isUpcoming ? 'text-blue-900' : isPast ? 'text-gray-700' : 'text-purple-900'
                              }`}>
                                {selection.student.name}
                              </h4>
                              <p className={`text-sm font-medium mb-1 rounded-lg px-2 py-1 inline-block ${
                                isUpcoming ? 'text-blue-700 bg-blue-100' : isPast ? 'text-gray-600 bg-gray-100' : 'text-purple-700 bg-purple-100'
                              }`}>
                                {selection.student.register_number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                isUpcoming ? 'text-blue-600' : isPast ? 'text-gray-500' : 'text-purple-600'
                              }`}>
                                {seminarTimingService.formatDateWithDay(selection.seminarDate).split(',')[0]}
                              </p>
                              <p className={`text-xs ${
                                isUpcoming ? 'text-blue-500' : isPast ? 'text-gray-400' : 'text-purple-500'
                              }`}>
                                {seminarTimingService.formatTime12Hour(new Date(selection.selectedAt))}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 bg-gray-50/60 backdrop-blur-sm rounded-xl border-2 border-gray-200">
                    <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                      <User className="h-10 w-10 mx-auto text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mb-2">No presentation history found</p>
                    <p className="text-xs text-gray-400">
                      Past and upcoming presentations will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Window Info */}
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gray-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">System Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50/60 backdrop-blur-sm rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium">Booking Window:</span>
                    <span className="text-gray-800 font-bold text-sm">
                      {seminarTimingService.getBookingWindowConfig().startTime} - {seminarTimingService.getBookingWindowConfig().endTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50/60 backdrop-blur-sm rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium">Selection Time:</span>
                    <span className="text-gray-800 font-bold text-sm">
                      {seminarTimingService.getBookingWindowConfig().selectionTime}
                    </span>
                  </div>
              
                
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}