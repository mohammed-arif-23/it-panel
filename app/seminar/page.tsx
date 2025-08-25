'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
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
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
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

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    initializeSeminarStudent()
  }, [user, router])

  // Real-time updates with auto-selection
  useEffect(() => {
    const updateWindowInfo = async () => {
      const info = seminarTimingService.getBookingWindowInfo()
      setWindowInfo(info)
      
      // Check if we should trigger auto-selection
      if (seminarTimingService.shouldTriggerAutoSelection() && !autoSelectionTriggered) {
        setAutoSelectionTriggered(true)
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
          console.error('Auto-selection error:', error)
          setSelectionMessage('Failed to trigger automatic selection')
        }
      }
    }

    updateWindowInfo()
    const interval = setInterval(updateWindowInfo, 1000)
    return () => clearInterval(interval)
  }, [autoSelectionTriggered, seminarStudent])

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
        console.error('Database error:', error)
        return
      }

      // If seminar student doesn't exist, create one
      if (!student) {
        const createResult = await seminarDbHelpers.createSeminarStudent(user.register_number)
        if (createResult.error) {
          console.error('Error creating seminar student:', createResult.error)
          return
        }
        student = createResult.data
      }

      setSeminarStudent(student)
    } catch (error) {
      console.error('Error initializing seminar student:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!seminarStudent) return

    setIsLoadingSelections(true)
    try {
      // Check if user has booked for next seminar
      const nextSeminarDate = seminarTimingService.getNextSeminarDate()
      const { data: booking } = await seminarDbHelpers.getStudentBooking(seminarStudent.id, nextSeminarDate)
      setHasBookedToday(!!booking)

      // Get today's selection (can be multiple, but show first one for today's display)
      const todayDate = seminarTimingService.getTodayDate()
      const { data: todaySelections } = await seminarDbHelpers.getSelectionsForDate(todayDate)
      if (todaySelections && todaySelections.length > 0) {
        const firstSelection = todaySelections[0]
        setTodaySelection({
          student: {
            id: (firstSelection as any).unified_students.id,
            register_number: (firstSelection as any).unified_students.register_number,
            name: (firstSelection as any).unified_students.name || (firstSelection as any).unified_students.register_number,
            class_year: (firstSelection as any).unified_students.class_year
          },
          selectedAt: (firstSelection as any).selected_at
        })
      }

      // Get tomorrow's selections (should be 2 students)
      const { data: tomorrowSelectionsData } = await seminarDbHelpers.getSelectionsForDate(nextSeminarDate)
      if (tomorrowSelectionsData && tomorrowSelectionsData.length > 0) {
        const allSelections = tomorrowSelectionsData.map((selection: any) => ({
          student: {
            id: selection.unified_students.id,
            register_number: selection.unified_students.register_number,
            name: selection.unified_students.name || selection.unified_students.register_number,
            class_year: selection.unified_students.class_year
          },
          selectedAt: selection.selected_at,
          seminarDate: nextSeminarDate
        }))
        
        // Filter selections to only show students from the same class as logged-in user
        const filteredSelections = user ? allSelections.filter((selection: TomorrowSelection) => 
          selection.student.class_year === user.class_year
        ) : allSelections
        setTomorrowSelections(filteredSelections)
      } else {
        setTomorrowSelections([])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoadingSelections(false)
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
      const nextSeminarDate = seminarTimingService.getNextSeminarDate()
      const { data, error } = await seminarDbHelpers.createBooking(seminarStudent.id, nextSeminarDate, seminarTopic)
      
      if (error) {
        if (error.code === '23505') {
          setBookingMessage(`You have already booked for next seminar (${seminarTimingService.formatDateWithDay(nextSeminarDate).split(',')[0]})!`)
          setHasBookedToday(true)
        } else {
          setBookingMessage('Failed to book. Please try again.')
        }
      } else {
        setBookingMessage(`Successfully booked for next seminar (${seminarTimingService.formatDateWithDay(nextSeminarDate).split(',')[0]})!`)
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
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#F7F7E7'}}>
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
    <div className="min-h-[70vh]" style={{backgroundColor: '#F7F7E7'}}>
      {/* Header with Back Button */}
      <div className="backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Button variant="ghost" asChild className="text-black hover:bg-white/20">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
              </Link>
            </Button>
            <div className="flex flex-col items-end">
              <p className="text-xl font-medium text-black">{user.name}</p>
              <p className="text-xs text-black">{user.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-black mb-2">Seminar Booking</h1>
          <p className="text-gray-600">Book your seminar slots and track your selections</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Window Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-black">Booking Window</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {windowInfo.isOpen ? (
                  <div className="border bg border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Booking Window is OPEN</span>
                    </div>
                    <p className="text-green-700 mb-2">
                      Time remaining: {windowInfo.timeUntilClose ? seminarTimingService.formatTimeRemaining(windowInfo.timeUntilClose) : 'Unknown'}
                    </p>
                    {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                      <p className="text-blue-700 mb-3">
                        Selection in: {seminarTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                      </p>
                    )}
                    
                    {hasBookedToday ? (
                      <div className="border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                          <span className="text-blue-800 font-medium">Already booked for tomorrow!</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              className={`w-full px-4 py-3 border ${topicError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                              placeholder="Enter your seminar topic title"
                            />
                            {topicError && (
                              <div className="text-red-600 text-sm mt-1">{topicError}</div>
                            )}
                          </div>
                          
                          <Button
                            onClick={handleBooking}
                            disabled={isBooking}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {isBooking ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Booking...
                              </>
                            ) : (
                              <>  
                                <Calendar className="h-4 w-4 mr-2" />
                                Book Next Seminar ({seminarTimingService.formatDateWithDay(seminarTimingService.getNextSeminarDate()).split(',')[0]})
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-black">Booking Window is CLOSED</span>
                    </div>
                    <p className="text-black mb-2">
                      Next opens in: {windowInfo.timeUntilOpen ? seminarTimingService.formatTimeRemaining(windowInfo.timeUntilOpen) : 'Unknown'}
                    </p>
                    {windowInfo.timeUntilSelection !== undefined && windowInfo.timeUntilSelection > 0 && (
                      <p className="text-blue-700 mb-2">
                        Selection in: {seminarTimingService.formatTimeRemaining(windowInfo.timeUntilSelection)}
                      </p>
                    )}
                 
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-black">Next Seminar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center rounded-lg p-4">
                  <p className="text-blue-900 font-medium mb-2">
                    {seminarTimingService.formatDateWithDay(seminarTimingService.getNextSeminarDate())}
                  </p>
                  <p className="text-blue-700 text-sm">
                    Selection at {seminarTimingService.getBookingWindowConfig().selectionTime}
                  </p>
                 
                </div>
              </CardContent>
            </Card>
          

            {/* Tomorrow's Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <User className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-black">Tomorrow's Selection ({user?.class_year || 'Your Class'})</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSelections ? (
                  <div className="text-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-2" />
                    <p className="text-sm text-gray-500">Loading selections...</p>
                  </div>
                ) : tomorrowSelections.length > 0 ? (
                  <div className="space-y-3">
                    {tomorrowSelections.map((selection, index) => (
                      <div key={index} className="  rounded-lg p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-purple-900 text-lg mb-1">
                            {selection.student.name} 
                            
                          </h3>
                          <p className="text-purple-700 text-sm mb-2">
                            {selection.student.class_year || 'IT Department'}
                          </p>
                          <p className="text-purple-600 text-xs">
                            Selected at: {seminarTimingService.formatTime12Hour(new Date(selection.selectedAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <User className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No {user?.class_year || 'your class'} student selected yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Selection will be made at {seminarTimingService.getBookingWindowConfig().selectionTime}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Window Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black">System Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Booking Window:</span>
                    <span className="text-black font-medium">
                      {seminarTimingService.getBookingWindowConfig().startTime} - {seminarTimingService.getBookingWindowConfig().endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Selection Time:</span>
                    <span className="text-black font-medium">
                      {seminarTimingService.getBookingWindowConfig().selectionTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Your Status:</span>
                    <span className={`font-medium ${hasBookedToday ? 'text-green-600' : 'text-black'}`}>
                      {hasBookedToday ? 'Booked' : 'Not Booked'}
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