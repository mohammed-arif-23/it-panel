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
      }
      
      if (finesData.success) {
        setFinesData(finesData.data)
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
      
      <div className="min-h-full flex flex-col items-center justify-center relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Student Information System</h1>
            <p className="text-gray-600 text-sm">Department of Information Technology</p>
          </div>

          <div className="mb-5 rounded-2xl flex items-center justify-center overflow-hidden">
            <img src={'/7408.jpg'} alt="Illustration" className='object-contain h-[40%] w-[40%]' />
          </div>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="px-6 py-4 ">
              {!showStudentDetails ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="student-search-container text-center relative">
                    <label className="block text-sm text-gray-700 mb-2">
                      Welcome to <b className='font-extrabold' style={{fontFamily: 'Playfair Display'}}>dynamIT</b>'s Student Corner 
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => {
                          const value = e.target.value
                          setStudentSearch(value)
                          setShowStudentDropdown(true)
                          setSelectedStudent(null)
                          setPassword('')
                          setStudentHasPassword(false)
                        }}
                        onFocus={() => setShowStudentDropdown(true)}
                        placeholder="Type your name or register number"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                        required
                      />
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
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
                  
                  {selectedStudent && (
                    <div className="mt-2 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Logging in as: {selectedStudent.name}
                          </span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 text-xs">
                          View Details
                        </Button>
                      </div>
                      <div className="mt-3">
                        {studentHasPassword ? (
                          <>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                                required
                              />
                              <Lock className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-yellow-50 text-center border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">You don't have any password set. Please use "Set Password" option below.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="error" message={error} className="mt-2" />
                  )}

                  <Button type="submit" disabled={isLoginDisabled()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">
                    {isLogging ? (<><Loader2 className="h-5 w-5 animate-spin mr-3" /> Logging in...</>) : (studentHasPassword ? 'Login to Dashboard' : 'Set Password & Login')}
                  </Button>
                  <div className="text-center mt-2">
                    <button type="button" onClick={() => router.push('/verify')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">{studentHasPassword ? 'Forgot Password?' : 'Set Password'}</button>
                  </div>
                </form>
              ) : (
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
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Selection
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )}

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
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
    
      <div className="relative overflow-hidden bg-white ">
        <div className="max-w-7xl mx-auto px-2 py-3 relative z-10">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-xl lg:text-3xl font-bold text-gray-800">Department of Information Technology</h2>
              <p className="text-gray-500 max-w-md text-sm mt-1">
                 <span className="text-md text-gray-700">{user?.name || 'Student'}</span> •  <span className="text-md text-gray-700">{user?.class_year || 'IT'}</span> •  <span className="text-md text-gray-700">{user?.register_number || 'IT'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" onClick={async () => { await logout(); router.push('/'); }} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {(isLoadingDashboard || isLoadingFines) ? (
          <div className="text-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-900">This will just take a second.</h3>
              </div>
            </div>
          </div>
        ) : (
          <>
          {/* Quick Access Tiles with ripple */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link href={tile.href} key={tile.title} className="group block">
                    <div className="h-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-blue-600 ripple" data-ripple>
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
            <Card className="bg-white shadow-sm border border-gray-200">
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <div className={`relative p-4 rounded-xl border ${
                    finesData && finesData.stats.totalFines > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${finesData && finesData.stats.totalFines > 0 ? 'bg-red-600' : 'bg-green-600'}`}>
                          {finesData && finesData.stats.totalFines > 0 ? (
                            <AlertTriangle className="h-5 w-5 text-white" />
                          ) : (
                            <IndianRupee className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Fine Details</h3>
                          <p className={`text-xs font-medium ${finesData && finesData.stats.totalFines > 0 ? 'text-red-700' : 'text-green-700'}`}>
                            {finesData && finesData.stats.totalFines > 0 ? 'Pending fines' : 'No pending fines'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-extrabold ${finesData && finesData.stats.totalFines > 0 ? 'text-red-700' : 'text-green-700'}`}>₹{finesData ? finesData.stats.totalFines : 0}</p>
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
