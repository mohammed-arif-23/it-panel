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
  }
  selectedAt: string
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



// Database helpers for seminar system
const seminarDbHelpers = {
  async findSeminarStudentByRegNumber(regNumber: string) {
    // Use the unified_students table from the compatible schema
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
      .single()
    
    return { data, error }
  },

  async getAllSelectionsForStudent(studentId: string) {
    const { data, error } = await supabase
      .from('unified_seminar_selections')
      .select('*')
      .eq('student_id', studentId)
      .order('seminar_date', { ascending: false })
    
    return { data, error }
  }
}

export default function SeminarPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [seminarStudent, setSeminarStudent] = useState<SeminarStudent | null>(null)
  const [windowInfo, setWindowInfo] = useState<BookingWindowInfo>({ isOpen: false })
  const [todaySelection, setTodaySelection] = useState<TodaySelection | null>(null)
  const [hasBookedToday, setHasBookedToday] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [userSelections, setUserSelections] = useState<Selection[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

    try {
      // Check if user has booked for tomorrow
      const tomorrowDate = seminarTimingService.getTomorrowDate()
      const { data: booking } = await seminarDbHelpers.getStudentBooking(seminarStudent.id, tomorrowDate)
      setHasBookedToday(!!booking)

      // Get today's selection
      const todayDate = seminarTimingService.getTodayDate()
      const { data: selection } = await seminarDbHelpers.getSelectionForDate(todayDate)
      if (selection) {
        setTodaySelection({
          student: {
            id: (selection as any).unified_students.id,
            register_number: (selection as any).unified_students.register_number,
            name: (selection as any).unified_students.name || (selection as any).unified_students.register_number
          },
          selectedAt: (selection as any).selected_at
        })
      }

      // Get user's previous selections
      const { data: selections } = await seminarDbHelpers.getAllSelectionsForStudent(seminarStudent.id)
      setUserSelections(selections || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
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
      const tomorrowDate = seminarTimingService.getTomorrowDate()
      const { data, error } = await seminarDbHelpers.createBooking(seminarStudent.id, tomorrowDate, seminarTopic)
      
      if (error) {
        if (error.code === '23505') {
          setBookingMessage('You have already booked for tomorrow!')
          setHasBookedToday(true)
        } else {
          setBookingMessage('Failed to book. Please try again.')
        }
      } else {
        setBookingMessage('Successfully booked for tomorrow\'s seminar!')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen">
      {/* User Info Bar */}
      <div className="backdrop-blur-sm ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-4">
            <div className="flex flex-col items-center ">
              
                  <h1 className="text-2xl font-semibold text-black">Seminar Booking</h1>
                  <p className="text-sm text-black">Book your seminar slots</p>
               
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                Book Tomorrow's Seminar
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
                    {windowInfo.nextOpenTime && (
                      <p className="text-sm text-black">
                        Next window: {seminarTimingService.formatTime12Hour(windowInfo.nextOpenTime)}
                      </p>
                    )}
                  </div>
                )}

                {bookingMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    bookingMessage.includes('Successfully') 
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {bookingMessage}
                  </div>
                )}
                
                {selectionMessage && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                    {selectionMessage}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tomorrow's Seminar Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-black">Tomorrow's Seminar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg p-4">
                  <p className="text-blue-900 font-medium">
                    {seminarTimingService.formatDate(seminarTimingService.getTomorrowDate())}
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Selection will be made after {seminarTimingService.getBookingWindowConfig().selectionTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                  <CardTitle className="text-black">Today's Selection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {todaySelection ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎉</div>
                      <p className="font-medium text-yellow-900">
                        {todaySelection.student.register_number}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Selected for today's seminar
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        Selected at {seminarTimingService.formatTime12Hour(new Date(todaySelection.selectedAt))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-black">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>No selection made yet for today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User's Previous Selections */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Trophy className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-black">Your Selections</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {userSelections.length > 0 ? (
                  <div className="space-y-3">
                    {userSelections.slice(0, 5).map((selection) => (
                      <div key={selection.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="font-medium text-green-900">
                          {seminarTimingService.formatDate(selection.seminar_date)}
                        </p>
                        <p className="text-sm text-green-700">
                          Selected at {seminarTimingService.formatTime12Hour(new Date(selection.selected_at))}
                        </p>
                      </div>
                    ))}
                    {userSelections.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{userSelections.length - 5} more selections
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p>No previous selections</p>
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