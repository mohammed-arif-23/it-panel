'use client'

import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut, FileText, User, AlertTriangle, IndianRupee, Search, CheckCircle, X, ArrowLeft, Lock } from 'lucide-react'
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

  // Redirect to profile if profile is incomplete
  useEffect(() => {
    // Profile check completed
    if (user) {
      // User details verified
      const profileComplete = isProfileComplete(user)
      // Profile completeness check performed
    }
    
    // Only check profile completeness after loading is done and user exists
    if (!loading && user) {
      const profileComplete = isProfileComplete(user)
      // Profile completion status determined
      
      if (!profileComplete) {
        // Redirecting to profile for completion
        setIsRedirecting(true)
        router.push('/profile')
        return
      }
    }
  }, [user, loading, router])

  // Fetch dashboard data when user is authenticated
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
      // Fetch both dashboard and fines data concurrently
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
        // Failed to fetch dashboard data - handling silently
      }
      
      if (finesData.success) {
        setFinesData(finesData.data)
      } else {
        // Failed to fetch fines data - handling silently
      }
      
    } catch (error) {
      // Error fetching dashboard data - handling silently
    } finally {
      setIsLoadingDashboard(false)
      setIsLoadingFines(false)
    }
  }

  // Fetch students based on search query
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

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    setRegisterNumber(student.register_number)
    setStudentSearch(`${student.name} (${student.register_number})`)
    setShowStudentDropdown(false)
    setError('')
    // Check if student has a password set
    setStudentHasPassword(!!student.password)
  }

  // Close dropdown when clicking outside
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

  // Function to check if login should be disabled
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

    // If student doesn't have a password set, we need to set one
    // If student has a password set, we need to verify it
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
        {/* Background Pattern */}
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

          {/* Video Container */}
          <div className="mb-6 rounded-2xl flex items-center justify-center overflow-hidden">
           <img src={'7408.jpg'} alt="Video" className=' object-contain h-[40%] w-[40%]'></img>
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
                          
                          // Reset student if the user is typing something different
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
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Welcome Section */}
            <div className="text-center lg:text-left lg:mb-0">
              <div className="flex items-center justify-center lg:justify-start mb-4">
               
                <div>
                  <h2 className="text-xl lg:text-4xl font-bold text-gray-800 mb-1">
                    Department of Information Technology
                  </h2>
                
                </div>
              </div>
              <p className="text-gray-500 max-w-md text-sm">
                 <span className="text-md text-gray-700">{user?.name || 'Student'}</span> •  <span className="text-md text-gray-700">{user?.class_year || 'IT'}</span>             
          •  <span className="text-md text-gray-700">{user?.register_number || 'IT'}</span>              </p>
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
        {/* Modern Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* NPTEL Card - Enhanced Design */}
          <Card className="group relative overflow-hidden bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-white m-1 rounded-lg">
              <CardHeader className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-t-lg border-b border-blue-100 pb-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      COURSES
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl font-extrabold text-gray-800 mt-4">
                  NPTEL Courses
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Track progress, submit assignments, and manage your learning journey
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Course Management</span>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/nptel">
                      Access NPTEL Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          

          {/* Seminar Card - Enhanced Design */}
          <Card className="group relative overflow-hidden bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-white m-1 rounded-lg">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-t-lg border-b border-green-100 pb-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      SEMINARS
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl font-extrabold text-gray-800 mt-4">
                  Seminar Booking
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Book presentation slots, view selections, and manage seminars
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Presentation Tracking</span>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/seminar">
                      Access Seminar Dashboard
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Assignments Card - Enhanced Design */}
          <Card className="group relative overflow-hidden bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-white m-1 rounded-lg">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-t-lg border-b border-purple-100 pb-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      ASSIGNMENTS
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl font-extrabold text-gray-800 mt-4">
                  Assignments
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Submit work, track deadlines, and monitor your progress
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Submission Portal</span>
                    </div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                  <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <Link href="/assignments">
                      View Assignments
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Learning App Card - Under Development (placed after Assignments) */}
          <Card className="group relative overflow-hidden bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            <div className="relative bg-white m-1 rounded-lg">
              <CardHeader className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-t-lg border-b border-cyan-100 pb-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-sky-500 rounded-xl shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-cyan-600 bg-cyan-100 px-2 py-1 rounded-full">
                      LEARN
                    </span>
                  </div>
                </div>
                <CardTitle className="text-xl font-extrabold text-gray-800 mt-4">
                  Learning App
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Enhance your Skills with <strong>dynamIT's</strong> Learning platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-cyan-600" />
                      <span className="text-sm font-medium text-gray-700">Personalized Learning</span>
                    </div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  </div>
                  <Button onClick={() => router.push('/learn')} className="w-full bg-gradient-to-r from-cyan-600 to-sky-600 text-white font-semibold py-3 rounded-xl shadow-lg ">
                    Go to Learning App
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>

        </div>

        {/* Enhanced Profile Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="group relative overflow-hidden bg-white shadow-2xl border-0 hover:shadow-3xl transition-all duration-500">
            {/* Gradient Border Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
            <div className="relative bg-white m-1 rounded-xl">
              <CardHeader className={`rounded-t-xl relative overflow-hidden ${
                finesData && finesData.stats.totalFines > 0 
                  ? 'bg-gradient-to-br from-red-50 via-pink-50 to-red-100' 
                  : 'bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100'
              }`}>
                {/* Header Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex flex-col items-center gap-4 justify-center ">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                          My Profile
                        </CardTitle>
                      </div>
                    </div>
                    {finesData && finesData.stats.totalFines > 0 && (
                      <div className="flex items-center space-x-2 bg-red-100 px-3 py-2 rounded-xl border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-bold text-red-600">Fine Alert</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Enhanced Profile Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-gray-800 flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                        Personal Information
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                          <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Full Name</label>
                          <p className="text-md font-semibold text-gray-800 mt-1">{user?.name || 'Not provided'}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
                          <label className="text-xs font-bold text-green-600 uppercase tracking-wider">Register Number</label>
                          <p className="text-md font-semibold text-gray-800 mt-1">{user?.register_number || 'Not provided'}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                          <label className="text-xs font-bold text-purple-600 uppercase tracking-wider">Class Year</label>
                          <p className="text-md font-semibold text-gray-800 mt-1">{user?.class_year || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contact Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mr-3"></div>
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                          <label className="text-xs font-bold text-cyan-600 uppercase tracking-wider">Email Address</label>
                          <p className="text-md font-semibold text-gray-800 mt-1 break-all">{user?.email || 'Not provided'}</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Mobile Number</label>
                          <p className="text-md font-semibold text-gray-800 mt-1">{user?.mobile || 'Not provided'}</p>
                        </div>
                       
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Financial Status */}
                  <div className={`relative p-6 rounded-2xl border-2 shadow-lg ${
                    finesData && finesData.stats.totalFines > 0 
                      ? 'bg-gradient-to-br from-red-50 via-pink-50 to-red-100 border-red-200' 
                      : 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-200'
                  }`}>
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5 rounded-2xl">
                      <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='15' cy='15' r='1'/%3E%3C/g%3E%3C/svg%3E")`
                      }}></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between ">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl shadow-lg ${
                            finesData && finesData.stats.totalFines > 0 
                              ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}>
                            {finesData && finesData.stats.totalFines > 0 ? (
                              <AlertTriangle className="h-6 w-6 text-white" />
                            ) : (
                              <IndianRupee className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-md font-bold text-gray-800">Fine Details</h3>
                            <p className={`text-sm font-medium ${
                              finesData && finesData.stats.totalFines > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-extrabold ${
                            finesData && finesData.stats.totalFines > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₹{finesData ? finesData.stats.totalFines : 0}
                          </p>
                        </div>
                      </div>
                   
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                    <Button 
                      className="h-14 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={async () => {
                        await logout();
                        router.push('/');
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        </>
        )}
      </div>
    </div>
  )
}