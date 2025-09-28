'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="text-center">
          <Loader/>
          <p className="mt-2 text-black">Loading your NPTEL data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  // Registration Form
  if (showRegistration) {
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
        <div className="backdrop-blur-md border-b bg-white shadow-xl relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Button variant="ghost" asChild className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl px-6 py-3 border border-gray-200 hover:border-blue-300">
                <Link href="/">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3 border border-gray-200">
                <p className="text-xl font-bold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600 font-medium">{user.register_number || 'Student'}</p>
              </div>
            </div>
          </div>
        </div>
     
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="mb-8 text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mx-auto max-w-2xl">
              <h1 className="text-4xl font-bold text-gray-800 mb-3">NPTEL Registration</h1>
              <p className="text-gray-600 text-md">Register for NPTEL courses to track your progress</p>
            </div>
          </div>
          
          <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
              <CardTitle className="text-gray-800 text-xl font-bold">Register for NPTEL Courses</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleRegistration} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Register Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.register_number}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-gray-800 cursor-not-allowed bg-white shadow-inner font-medium"
                  />
                  <p className="text-xs text-gray-600 mt-2">Register number cannot be changed as it's linked to your account</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationData.name}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={registrationData.mobile}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, mobile: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter your mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Class
                  </label>
                  <select
                    required
                    value={registrationData.class_name}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, class_name: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                  >
                    <option value="">Select your class</option>
                    <option value="II-IT">II-IT</option>
                    <option value="III-IT">III-IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    NPTEL Course Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationData.nptel_course_name}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, nptel_course_name: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter NPTEL course name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    NPTEL Course ID
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationData.nptel_course_id}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, nptel_course_id: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter NPTEL course ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Course Duration (in weeks)
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationData.course_duration}
                    onChange={(e) => setRegistrationData(prev => ({ ...prev, course_duration: e.target.value }))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="e.g., 12 weeks, 8 weeks"
                  />
                </div>

                {registrationError && (
                  <Alert 
                    variant="error" 
                    message={registrationError} 
                    className="mt-4"
                  />
                )}

                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
                >
                  {isRegistering ? (
                    <>
                      <Loader/>
                      Registering...
                    </>
                  ) : (
                    "Register for NPTEL Course"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main NPTEL Dashboard
  return (
    <div className="min-h-[70vh] relative" style={{backgroundColor: '#FFFFFF'}}>
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
            <Button variant="ghost" asChild className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300  hover:shadow-xl rounded-xl px-6 py-3 hover:border-blue-300">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 mr-2" />
                
              </Link>
            </Button>
            <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3 ">
              <p className="text-xl font-bold text-gray-800">{user?.name || 'Student'}</p>
              <p className="text-sm text-gray-600 font-medium">{user?.register_number || 'Register Number'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl p-2 mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">NPTEL Dashboard</h1>
            <p className="text-gray-600 text-sm">Track your NPTEL course progress and weekly assignments</p>
          </div>
        </div>
        
        {student ? (
          <>
            {/* Course Overview */}
            <Card className="bg-white mb-6 shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
                <CardTitle className="text-gray-800 text-xl font-bold">Course Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
            <Card className="bg-white mb-6 shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
                <CardTitle className="text-gray-800 text-xl font-bold">Current Week Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
            <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
                <CardTitle className="text-gray-800 text-xl font-bold">Weekly Progress</CardTitle>
                <CardDescription className="text-gray-800">
                  Update your weekly assignment status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
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
  )
}