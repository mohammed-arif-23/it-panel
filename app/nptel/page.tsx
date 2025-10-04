'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { PullToRefresh } from '@/components/pwa/PullToRefresh'
import { 
  BookOpen, 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Lock, 
  Unlock,
  TrendingUp,
  Award,
  RefreshCw,
  Loader2,
  GraduationCap,
  LogOut,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Alert from '@/components/ui/alert'
import Loader from '@/components/ui/loader'
import { SkeletonCard } from '@/components/ui/skeletons'

interface NPTELRegistrationData {
  register_number: string
  name: string
  email: string
  mobile: string
  class_name: string
  nptel_course_name: string
  nptel_course_id: string
  course_duration: string
}

interface StudentData {
  id: string
  register_number: string
  student_name: string
  email: string
  mobile: string
  class_name: string
  nptel_course_name: string
  nptel_course_id: string
  course_duration: string
  week_1_status: string
  week_2_status: string
  week_3_status: string
  week_4_status: string
  week_5_status: string
  week_6_status: string
  week_7_status: string
  week_8_status: string
  week_9_status: string
  week_10_status: string
  week_11_status: string
  week_12_status: string
  week_1_updated_at?: string
  week_2_updated_at?: string
  week_3_updated_at?: string
  week_4_updated_at?: string
  week_5_updated_at?: string
  week_6_updated_at?: string
  week_7_updated_at?: string
  week_8_updated_at?: string
  week_9_updated_at?: string
  week_10_updated_at?: string
  week_11_updated_at?: string
  week_12_updated_at?: string
}

const statusOptions = [
  { value: "in_progress", label: "In Progress", icon: Clock, color: "text-yellow-600" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "text-green-600" },
]

export default function NPTELPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weekAccessStatus, setWeekAccessStatus] = useState<{
    isOpen: boolean
    nextOpenTime: Date | null
    timeRemaining: string
  }>({
    isOpen: false,
    nextOpenTime: null,
    timeRemaining: ""
  })
  const [registrationData, setRegistrationData] = useState<NPTELRegistrationData>({
    register_number: '',
    name: '',
    email: '',
    mobile: '',
    class_name: '',
    nptel_course_name: '',
    nptel_course_id: '',
    course_duration: '12'
  })
  const [registrationError, setRegistrationError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    // Set user data in registration form
    setRegistrationData(prev => ({
      ...prev,
      register_number: user.register_number,
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      class_name: user.class_year || ''
    }))
    
    loadStudentData()
  }, [user, router])

  // Timer effect to update current time and check week access
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      checkWeekAccess(now)
    }, 100)

    return () => clearInterval(timer)
  }, [student])

  const loadStudentData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const tableName = user.class_year === "II-IT" ? "ii_it_students" : "iii_it_students"
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('register_number', user.register_number)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found - show registration
          setShowRegistration(true)
        } else {
          // Error loading student data - handling silently
        }
      } else {
        setStudent(data)
        setShowRegistration(false)
      }
    } catch (error) {
      // Error loading student data - handling silently
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadStudentData()
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsRegistering(true)
    setRegistrationError('')

    // Validate required fields
    if (!registrationData.name.trim()) {
      setRegistrationError('Please enter your name')
      setIsRegistering(false)
      return
    }
    if (!registrationData.email.trim()) {
      setRegistrationError('Please enter your email')
      setIsRegistering(false)
      return
    }
    if (!registrationData.mobile.trim()) {
      setRegistrationError('Please enter your mobile number')
      setIsRegistering(false)
      return
    }
    if (!registrationData.class_name) {
      setRegistrationError('Please select your class')
      setIsRegistering(false)
      return
    }
    if (!registrationData.nptel_course_name.trim()) {
      setRegistrationError('Please enter NPTEL course name')
      setIsRegistering(false)
      return
    }
    if (!registrationData.nptel_course_id.trim()) {
      setRegistrationError('Please enter NPTEL course ID')
      setIsRegistering(false)
      return
    }
    if (!registrationData.course_duration.trim()) {
      setRegistrationError('Please enter course duration')
      setIsRegistering(false)
      return
    }

    try {
      // First, update the user's personal information in the unified students table
      const { error: updateError } = await (supabase as any)
        .from('unified_students')
        .update({
          name: registrationData.name,
          email: registrationData.email,
          mobile: registrationData.mobile,
          class_year: registrationData.class_name
        })
        .eq('register_number', user.register_number)

      if (updateError) {
        // Error updating user profile - handling silently
        // Continue with NPTEL registration even if profile update fails
      }

      // Then register for NPTEL course
      const tableName = registrationData.class_name === "II-IT" ? "ii_it_students" : "iii_it_students"
      
      const dbData = {
        register_number: user.register_number, // Keep register number from auth
        student_name: registrationData.name,
        email: registrationData.email,
        mobile: registrationData.mobile,
        class_name: registrationData.class_name, // Use form data instead of user.class_year
        nptel_course_name: registrationData.nptel_course_name,
        nptel_course_id: registrationData.nptel_course_id,
        course_duration: registrationData.course_duration,
        week_1_status: "in_progress",
        week_2_status: "not_started",
        week_3_status: "not_started",
        week_4_status: "not_started",
        week_5_status: "not_started",
        week_6_status: "not_started",
        week_7_status: "not_started",
        week_8_status: "not_started",
        week_9_status: "not_started",
        week_10_status: "not_started",
        week_11_status: "not_started",
        week_12_status: "not_started",
      }

      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert([dbData])
        .select()
        .single()

      if (error) {
        if (error.code === "23505") {
          setRegistrationError("Registration number already exists")
        } else {
          setRegistrationError(`Registration failed: ${error.message}`)
        }
        return
      }

      setStudent(data)
      setShowRegistration(false)
    } catch (error) {
      // Registration error - handling silently
      setRegistrationError('Something went wrong. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  const getCurrentWeek = () => {
    if (!student) return 1
    const courseDuration = Number.parseInt(student.course_duration) || 12
    
    for (let week = courseDuration; week >= 1; week--) {
      const status = student[`week_${week}_status` as keyof StudentData] as string
      if (status === "in_progress" || status === "completed") {
        return week
      }
    }
    return 1
  }

  const checkWeekAccess = (now: Date) => {
    const currentWeek = getCurrentWeek()

    if (currentWeek === 1 || !student) {
      setWeekAccessStatus({
        isOpen: true,
        nextOpenTime: null,
        timeRemaining: "Ready for submission"
      })
      return
    }

    const prevWeek = currentWeek - 1
    const prevWeekUpdateTime = student[`week_${prevWeek}_updated_at` as keyof StudentData] as string
    
    if (prevWeekUpdateTime) {
      const lastUpdate = new Date(prevWeekUpdateTime)
      const nextMonday = new Date(lastUpdate)
      const currentDay = lastUpdate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // Calculate days to add to get to next Monday
      let daysToAdd
      if (currentDay === 0) { // Sunday
        daysToAdd = 1 // Next Monday is tomorrow
      } else if (currentDay === 1) { // Monday
        daysToAdd = 7 // Next Monday is in 7 days
      } else { // Tuesday (2) through Saturday (6)
        daysToAdd = 8 - currentDay // Days until next Monday
      }
      
      nextMonday.setDate(lastUpdate.getDate() + daysToAdd)
      nextMonday.setHours(0, 0, 0, 0)
      
      if (now < nextMonday) {
        const remainingTime = nextMonday.getTime() - now.getTime()
        const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
        const remainingHours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const remainingMinutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60))
        const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000)
        
        setWeekAccessStatus({
          isOpen: false,
          nextOpenTime: nextMonday,
          timeRemaining: `Unlocks in ${remainingDays}D ${remainingHours}H ${remainingMinutes}M ${remainingSeconds}s`
        })
        return
      }
    }
    
    setWeekAccessStatus({
      isOpen: true,
      nextOpenTime: null,
      timeRemaining: "Ready for submission"
    })
  }

  const updateWeekStatus = async (week: number, status: string) => {
    if (!student || !user) {
      alert("Error: No student data found. Please logout and login again.")
      return
    }

    const currentWeek = getCurrentWeek()
    if (week !== currentWeek) {
      alert(`Can only update current week (Week ${currentWeek})`)
      return
    }

    if (!weekAccessStatus.isOpen) {
      alert("This week is currently locked. Please wait for the unlock time.")
      return
    }

    setIsUpdating(true)
    const weekColumn = `week_${week}_status`
    const weekUpdatedAtColumn = `week_${week}_updated_at`
    const tableName = user.class_year === "II-IT" ? "ii_it_students" : "iii_it_students"
    const currentTimestamp = new Date().toISOString()

    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update({ 
          [weekColumn]: status,
          [weekUpdatedAtColumn]: currentTimestamp
        })
        .eq("register_number", user.register_number)
        .select()
        .single()

      if (error) {
        // Database update failed - handling silently
        alert(`Failed to update status: ${error.message}`)
        return
      }

      if (!data) {
        alert("Failed to update status: No data returned")
        return
      }

      setStudent(data)

      if (status === "completed" && week < (Number.parseInt(student.course_duration) || 12)) {
        const nextWeek = week + 1
        const nextWeekColumn = `week_${nextWeek}_status`
        
        await (supabase as any)
          .from(tableName)
          .update({ [nextWeekColumn]: "in_progress" })
          .eq("register_number", user.register_number)

        await loadStudentData()
      }

      alert(`Week ${week} status updated successfully!`)
    } catch (error) {
      // Update error - handling silently
      alert("Failed to update status. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const calculateOverallProgress = () => {
    if (!student) return 0
    const courseDuration = Number.parseInt(student.course_duration) || 12
    let completedWeeks = 0
    
    for (let week = 1; week <= courseDuration; week++) {
      const status = student[`week_${week}_status` as keyof StudentData] as string
      if (status === "completed") {
        completedWeeks++
      }
    }
    
    return Math.round((completedWeeks / courseDuration) * 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  // Main NPTEL Dashboard
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-[var(--color-background)] pb-20 page-transition">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors ripple">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-bold text-[var(--color-primary)]">NPTEL Course</h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>

        <div className="px-4 py-6">
        {student ? (
          <>
            {/* Course Overview */}
            <Card className="saas-card mb-4">
              <CardHeader className="border-b border-[var(--color-border-light)]">
                <CardTitle className="text-[var(--color-primary)] text-base font-bold">Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardDescription className="text-gray-800">
                      Course ID: {student.nptel_course_id} • {student.course_duration} weeks
                      <br />
                      Course Name : {student.nptel_course_name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{calculateOverallProgress()}%</div>
                    <div className="text-sm text-gray-800">Overall Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Week Status */}
            <Card className="saas-card mb-4">
              <CardHeader className="border-b border-[var(--color-border-light)]">
                <CardTitle className="text-[var(--color-primary)] text-base font-bold">Current Week Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-between p-4  rounded-lg">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Week {getCurrentWeek()}</p>
                    <p className="text-sm text-gray-800">{weekAccessStatus.timeRemaining}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {weekAccessStatus.isOpen ? (
                      <Unlock className="h-6 w-6 text-green-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-red-600" />
                    )}
                    {getStatusBadge(student[`week_${getCurrentWeek()}_status` as keyof StudentData] as string)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="saas-card">
              <CardHeader className="border-b border-[var(--color-border-light)]">
                <CardTitle className="text-[var(--color-primary)] text-base font-bold">Weekly Progress</CardTitle>
                <CardDescription className="text-[var(--color-text-muted)] text-sm">
                  Update your weekly assignment status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: Number.parseInt(student.course_duration) || 12 }, (_, index) => {
                    const weekNumber = index + 1
                    const status = student[`week_${weekNumber}_status` as keyof StudentData] as string
                    const isCurrentWeek = weekNumber === getCurrentWeek()
                    const isLocked = weekNumber > getCurrentWeek()
                    const canUpdate = isCurrentWeek && weekAccessStatus.isOpen && status !== 'completed'

                    return (
                      <Card key={weekNumber} className={`relative ${
                        isLocked ? 'opacity-50' : ''
                      } ${status === 'completed' ? 'ring-2 ring-green-200' : ''} ${
                        isCurrentWeek ? 'ring-2 ring-blue-200' : ''
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-gray-800">Week {weekNumber}</CardTitle>
                            {isLocked ? (
                              <Lock className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {getStatusBadge(status)}
                            
                            {canUpdate && (
                              <Select
                                value={status}
                                onValueChange={(value: string) => updateWeekStatus(weekNumber, value)}
                                disabled={isUpdating}
                              >
                                <SelectTrigger className="w-full bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className='bg-gray-50'>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex  items-center space-x-2">
                                        <option.icon className={`h-4 w-4 ${option.color}`} />
                                        <span>{option.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-xl border border-gray-200">
            <Loader/>
            <p className="text-gray-700 font-medium">Loading course data...</p>
          </div>
        )}
        </div>
      </div>
    </PullToRefresh>
  )
}