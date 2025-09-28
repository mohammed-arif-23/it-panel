'use client'

import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut, FileText, User, AlertTriangle, IndianRupee, Search, CheckCircle, X, ArrowLeft, Lock, CalendarDays, ClipboardList, BarChart3, Megaphone, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Alert from '../components/ui/alert'

interface Student {
  id: string;
  name: string;
  register_number: string;
  class_year: string;
  password?: string | null;
}

export default function HomePage() {
  const { user, loading, login, logout, hasRegistration } = useAuth()
  const router = useRouter()
  const [registerNumber, setRegisterNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [finesData, setFinesData] = useState<any>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isLoadingFines, setIsLoadingFines] = useState(false)
  
  // Student dropdown states
  const [students, setStudents] = useState<Student[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [studentHasPassword, setStudentHasPassword] = useState(false)

  const isProfileComplete = (user: any) => {
    if (!user) return false
    
    const requiredFields = {
      name: user.name?.trim(),
      email: user.email?.trim(),
      mobile: user.mobile?.trim(),
      class_year: user.class_year?.trim()
    }
    
    // Check if all required fields are present and not empty
    return Object.values(requiredFields).every(field => field && field.length > 0)
  }

  useEffect(() => {
    if (user) {
      const profileComplete = isProfileComplete(user)
    }
    
    if (!loading && user) {
      const profileComplete = isProfileComplete(user)
      
      if (!profileComplete) {
        setIsRedirecting(true)
        router.push('/profile')
        return
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading && isProfileComplete(user)) {
      fetchDashboardData()
    }
  }, [user, loading])

  const fetchDashboardData = async () => {
    if (!user?.id) return
    
    setIsLoadingDashboard(true)
    setIsLoadingFines(true)
    
    try {
      const [dashboardResponse, finesResponse] = await Promise.all([
        fetch(`/api/dashboard?studentId=${user.id}`),
        fetch(`/api/dashboard/fines?studentId=${user.id}`)
      ])
      
      const [dashboardData, finesData] = await Promise.all([
        dashboardResponse.json(),
        finesResponse.json()
      ])
      
      if (dashboardData.success) {
        setDashboardData(dashboardData.data)
      } else {
      }
      
      if (finesData.success) {
        setFinesData(finesData.data)
      } else {
      }
      
    } catch (error) {
    } finally {
      setIsLoadingDashboard(false)
      setIsLoadingFines(false)
    }
  }

  const fetchStudents = async (search: string) => {
    if (search.length < 2) {
      setStudents([])
      return
    }

    setIsLoadingStudents(true)
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(search)}&limit=10`)
      const result = await response.json()
      
      if (result.success) {
        setStudents(result.data || [])
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setIsLoadingStudents(false)
    }
  }

  // Debounce student search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (studentSearch && !selectedStudent) {
        fetchStudents(studentSearch)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [studentSearch, selectedStudent])

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setRegisterNumber(student.register_number)
    setStudentSearch(`${student.name} (${student.register_number})`)
    setShowStudentDropdown(false)
    setError('')
    setStudentHasPassword(!!student.password)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.student-search-container')) {
        setShowStudentDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isLoginDisabled = (): boolean => {
    return isLogging || !selectedStudent || (!studentHasPassword && !password)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)
    setError('')

    if (!selectedStudent) {
      setError('Please select a student')
      setIsLogging(false)
      return
    }

    const result = await login(
      selectedStudent.register_number, 
      password || undefined
    )
    
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    setIsLogging(false)
  }

  if (loading || isRedirecting) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="text-center">
          {/* Loading */}
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">
              {isRedirecting ? 'Redirecting to profile...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] relative" style={{backgroundColor: '#FFFFFF'}}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      
      <div className="min-h-full flex flex-col items-center justify-center  relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">        
            <h1 className="text-xl font-bold text-gray-900 mb-2">Department of Information Technology</h1>
            <p className="text-gray-600">Student Information System</p>
          </div>

          <div className="mb-6 rounded-2xl flex items-center justify-center overflow-hidden">
           <img src={'/7408.jpg'} alt="Illustration" className='object-contain h-[40%] w-[40%]' />
          </div>

          <Card className="backdrop-blur-md  bg-white border-0 shadow-none hover:shadow-3xl transition-all duration-300">
            <CardContent className="px-8 py-2 ">
              {!showStudentDetails ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="student-search-container text-center relative">
                    <label className="block text-md text-gray-700 mb-2">
                      Welcome to <b className='font-extrabold text-lg' style={{fontFamily: 'Playfair Display'}}>dynamIT</b>'s Student Corner 
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => {
                          const value = e.target.value
                          setStudentSearch(value)
                          setShowStudentDropdown(true)
                          
                          if (selectedStudent) {
                            const selectedDisplayText = `${selectedStudent.name} (${selectedStudent.register_number})`
                            if (value !== selectedDisplayText && !selectedDisplayText.toLowerCase().includes(value.toLowerCase())) {
                              setSelectedStudent(null)
                              setRegisterNumber('')
                              setPassword('')
                              setStudentHasPassword(false)
                            }
                          } else if (!value) {
                            setSelectedStudent(null)
                            setRegisterNumber('')
                            setPassword('')
                            setStudentHasPassword(false)
                          }
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        placeholder="Type your name or register number"
                        className="w-full px-4 py-4 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                        required
                      />
                      <Search className="h-4 w-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    {/* Student Dropdown */}
                    {showStudentDropdown && (studentSearch.length >= 2 || students.length > 0) && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {isLoadingStudents ? (
                          <div className="flex items-center justify-center p-3">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Searching...</span>
                          </div>
                        ) : students.length > 0 ? (
                          students.map((student) => (
                            <div
                              key={student.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleStudentSelect(student)}
                            >
                              <div className="flex space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {student.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {student.register_number} • {student.class_year}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : studentSearch.length >= 2 ? (
                          <div className="p-3 text-center text-gray-500">
                            <p className="text-sm">No students found</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Student Indicator */}
                  {selectedStudent && (
                    <div className="mt-2 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Logging in as: {selectedStudent.name} 
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowStudentDetails(true)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                      
                      {/* Password Field or Message */}
                      <div className="mt-3">
                        {studentHasPassword ? (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Password
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                                required
                              />
                              <Lock className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-yellow-50 text-center border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              You don't have any password set. Please use "Set Password" option below.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert 
                      variant="error" 
                      message={error} 
                      className="mt-4"
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={isLoginDisabled()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLogging ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Logging in...
                      </>
                    ) : (
                      studentHasPassword ? "Login to Dashboard" : "Set Password & Login"
                    )}
                  </Button>
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => router.push('/verify')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {studentHasPassword ? "Forgot Password?" : "Set Password"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Student Details View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => {
                        setShowStudentDetails(false)
                        setPassword('')
                        setShowPassword(false)
                      }}
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-800 p-0"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Selection
                    </Button>
                  </div>
                  
                  {selectedStudent && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-gray-800 mb-3">Student Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="text-sm font-medium text-gray-800">{selectedStudent.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Register Number:</span>
                          <span className="text-sm font-medium text-gray-800">{selectedStudent.register_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Class:</span>
                          <span className="text-sm font-medium text-gray-800">{selectedStudent.class_year}</span>
                        </div>
                      </div>
                      
                      {/* Password Field in Details View */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {studentHasPassword ? "Password" : "Set Password"}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={studentHasPassword ? "Enter your password" : "Set a password for your account"}
                            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                            required={!studentHasPassword} // Only required if setting a new password
                          />
                          <Lock className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {!studentHasPassword && (
                          <p className="text-xs text-gray-500 mt-1">You need to set a password for your account</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                      <Alert 
                        variant="error" 
                        message={error} 
                        className="mt-4"
                      />
                    )}
                    
                    <Button
                      type="submit"
                      disabled={isLoginDisabled()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLogging ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-3" />
                          Logging in...
                        </>
                      ) : (
                        "Login to Dashboard"
                      )}
                    </Button>
                    <div className="text-center mt-4">
                      <button 
                        type="button"
                        onClick={() => router.push('/verify')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>

          
          
        </div>
      </div>
    </div>
  )}

  // Dashboard View
  const quickTiles = useMemo(() => ([
    { title: 'Attendance', href: '/attendance', icon: CheckCircle, hint: 'View daily attendance' },
    { title: 'Timetable', href: '/timetable', icon: CalendarDays, hint: 'Class schedule' },
    { title: 'Courses', href: '/nptel', icon: BookOpen, hint: 'Your enrolled courses' },
    { title: 'Assignments', href: '/assignments', icon: FileText, hint: 'Submit and track' },
    { title: 'Exams', href: '/exams', icon: ClipboardList, hint: 'Exam schedule' },
    { title: 'Results', href: '/results', icon: BarChart3, hint: 'Marks and grades' },
    { title: 'Fees', href: '/profile?tab=fines', icon: IndianRupee, hint: 'Fines/fees status' },
    { title: 'Notices', href: '/notices', icon: Megaphone, hint: 'Department announcements' },
    { title: 'Profile', href: '/profile', icon: User, hint: 'Your account' },
    { title: 'Support', href: '/support', icon: HelpCircle, hint: 'Get help' },
  ]), [])

  return (
    <div className="min-h-[70vh] relative" style={{backgroundColor: '#FFFFFF'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
    
      {/* Clean Professional Header */}
      <div className="relative overflow-hidden bg-white ">
        <div className="max-w-7xl mx-auto px-2 py-3 relative z-10">
          <div className="flex items-center justify-between">
            {/* Welcome Section */}
            <div className="text-left">
              <h2 className="text-xl lg:text-3xl font-bold text-gray-800">
                Department of Information Technology
              </h2>
              <p className="text-gray-500 max-w-md text-sm mt-1">
                 <span className="text-md text-gray-700">{user?.name || 'Student'}</span> •  <span className="text-md text-gray-700">{user?.class_year || 'IT'}</span> •  <span className="text-md text-gray-700">{user?.register_number || 'IT'}</span>
              </p>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={async () => { await logout(); router.push('/'); }}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Loading State - Show loading until both dashboard and fines data are loaded */}
        {(isLoadingDashboard || isLoadingFines) ? (
          <div className="text-center py-28">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">This will just take a second.</h3>
                </div>
            </div>
          </div>
        ) : (
          <>
          {/* Quick Access Tiles - Professional, flat, Android-like */}
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link href={tile.href} key={tile.title} className="group block">
                    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-blue-600">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{tile.title}</div>
                          <div className="text-xs text-gray-500">{tile.hint}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Profile and Finance Summary */}
          <div className="max-w-4xl mx-auto">
            <Card className="group relative overflow-hidden bg-white shadow-sm border border-gray-200">
              <CardHeader className="rounded-t-xl bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-800">My Profile</CardTitle>
                  {finesData && finesData.stats.totalFines > 0 && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-semibold">Fine Alert</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Profile Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-700">Personal Information</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{user?.name || 'Not provided'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Register Number</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{user?.register_number || 'Not provided'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class Year</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{user?.class_year || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-700">Contact Information</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1 break-all">{user?.email || 'Not provided'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number</label>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{user?.mobile || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Status */}
                  <div className={`relative p-4 rounded-xl border ${
                    finesData && finesData.stats.totalFines > 0 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          finesData && finesData.stats.totalFines > 0 ? 'bg-red-600' : 'bg-green-600'
                        }`}>
                          {finesData && finesData.stats.totalFines > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-white" />
                          ) : (
                            <IndianRupee className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Fine Details</h3>
                          <p className={`text-xs font-medium ${
                            finesData && finesData.stats.totalFines > 0 ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {finesData && finesData.stats.totalFines > 0 ? 'Pending fines' : 'No pending fines'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-extrabold ${
                          finesData && finesData.stats.totalFines > 0 ? 'text-red-700' : 'text-green-700'
                        }`}>
                          ₹{finesData ? finesData.stats.totalFines : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          </>
        )}
      </div>
    </div>
  )
}
