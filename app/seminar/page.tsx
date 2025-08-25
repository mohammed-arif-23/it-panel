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
                {windowInfo.isOpen ? (
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
                        message="You have successfully booked for tomorrow's seminar!" 
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
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
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
                    {seminarTimingService.formatDateWithDay(seminarTimingService.getNextSeminarDate())}
                  </p>
                  <p className="text-blue-700 text-sm font-medium">
                    Selection at {seminarTimingService.getBookingWindowConfig().selectionTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          

            {/* Tomorrow's Selection */}
            <Card className="bg-white/80 backdrop-blur-md shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-purple-50/50 rounded-t-lg border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-gray-800 text-xl font-bold">Tomorrow's Selection ({user?.class_year || 'Your Class'})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingSelections ? (
                  <div className="text-center py-8 bg-purple-50/60 backdrop-blur-sm rounded-xl border-2 border-purple-200">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-purple-600 mb-3" />
                    <p className="text-sm text-purple-600 font-medium">Loading selections...</p>
                  </div>
                ) : tomorrowSelections.length > 0 ? (
                  <div className="space-y-4">
                    {tomorrowSelections.map((selection, index) => (
                      <div key={index} className="bg-purple-50/70 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-center">
                          <h3 className="font-bold text-purple-900 text-xl mb-2">
                            {selection.student.name} 
                          </h3>
                          <p className="text-purple-700 text-sm font-medium mb-3 bg-purple-100 rounded-lg px-3 py-1 inline-block">
                            {selection.student.class_year || 'IT Department'}
                          </p>
                          <p className="text-purple-600 text-sm font-medium">
                            Selected at: {seminarTimingService.formatTime12Hour(new Date(selection.selectedAt))}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="text-center text-purple-600 text-sm font-bold mt-4 bg-purple-100/60 rounded-lg py-2">
                      {tomorrowSelections.length} student{tomorrowSelections.length > 1 ? 's' : ''} from {user?.class_year || 'your class'} selected
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 bg-gray-50/60 backdrop-blur-sm rounded-xl border-2 border-gray-200">
                    <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
                      <User className="h-10 w-10 mx-auto text-gray-400" />
                    </div>
                    <p className="text-sm font-medium mb-2">No {user?.class_year || 'your class'} student selected yet</p>
                    <p className="text-xs text-gray-400">
                      Selection will be made at {seminarTimingService.getBookingWindowConfig().selectionTime}
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
                  <div className="flex justify-between items-center p-3 bg-gray-50/60 backdrop-blur-sm rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium">Your Status:</span>
                    <span className={`font-bold text-sm px-3 py-1 rounded-lg ${hasBookedToday ? 'text-green-700 bg-green-100' : 'text-orange-700 bg-orange-100'}`}>
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