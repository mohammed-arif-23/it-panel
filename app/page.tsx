'use client'

import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboardData, useFinesData } from '../hooks/useDashboardData'
import { useStudentSearch } from '../hooks/useStudentSearch'
import { useDebounce } from '../hooks/useDebounce'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut, FileText, User, AlertTriangle, IndianRupee, Search, CheckCircle, X, ArrowLeft, Lock, CalendarDays, ClipboardList, BarChart3, Megaphone, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import Alert from '../components/ui/alert'
import Loader from '../components/ui/loader'

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
  
  // Student dropdown states
  const [studentSearch, setStudentSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDetails, setShowStudentDetails] = useState(false)
  const [studentHasPassword, setStudentHasPassword] = useState(false)

  // Debounced search for better performance
  const debouncedSearch = useDebounce(studentSearch, 300)
  
  // Query hooks for data fetching
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardData(user?.id || '')
  const { data: finesData, isLoading: isLoadingFines } = useFinesData(user?.id || '')
  const { data: students = [], isLoading: isLoadingStudents } = useStudentSearch(debouncedSearch)

  // Move useMemo hook here to ensure consistent hook order
  const quickTiles = useMemo(() => ([
   // { title: 'Attendance', href: '/attendance', icon: CheckCircle, hint: 'View daily attendance' },
   // { title: 'Timetable', href: '/timetable', icon: CalendarDays, hint: 'Class schedule' },
    { title: 'NPTEL', href: '/nptel', icon: BookOpen, hint: 'Your NPTEL courses' },
    { title: 'Assignments', href: '/assignments', icon: FileText, hint: 'Submit and track' },
    { title: 'Seminar', href: '/seminar', icon: ClipboardList, hint: 'Seminar management' },
    { title: 'Learning Platform', href: '/learn', icon: BookOpen, hint: 'Access learning resources' },
    { title: 'Fees', href: '/fines', icon: IndianRupee, hint: 'Fines/fees status' },
    { title: 'Profile', href: '/profile', icon: User, hint: 'Your account' },
  ]), [])

  const isProfileComplete = useCallback((user: any) => {
    if (!user) return false
    
    const requiredFields = {
      name: user.name?.trim(),
      email: user.email?.trim(),
      mobile: user.mobile?.trim(),
      class_year: user.class_year?.trim()
    }
    
    return Object.values(requiredFields).every(field => field && field.length > 0)
  }, [])

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

  // Remove the old fetchDashboardData function and useEffect since we're using React Query now

  // Remove old fetchStudents function and useEffect since we're using React Query now

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student)
    setStudentSearch(`${student.name} (${student.register_number})`)
    setShowStudentDropdown(false)
    setError('')
    setStudentHasPassword(!!student.password)
  }, [])

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

  const isLoginDisabled = useCallback((): boolean => {
    return isLogging || !selectedStudent || (!studentHasPassword && !password)
  }, [isLogging, selectedStudent, studentHasPassword, password])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
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
  }, [selectedStudent, password, login])

  if (loading || isRedirecting) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
        <div className="w-16 h-16">
          <Loader />
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

          <Card className="bg-white border border-white shadow-none">
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
                            <div className="w-4 h-4 mr-2">
                              <Loader />
                            </div>
                            <span className="text-sm text-gray-600">Searching...</span>
                          </div>
                        ) : students.length > 0 ? (
                          students.map((student) => (
                            <StudentDropdownItem
                              key={student.id}
                              student={student}
                              onSelect={handleStudentSelect}
                            />
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
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl lg:text-3xl font-bold text-gray-800">Department of Information Technology</h2>
              <p className="text-gray-500 max-w-md text-sm mt-1">
                 <span className="text-md my-4 text-gray-700">{user?.name?.toLocaleUpperCase() || 'Student'}</span> •  <span className="text-md text-gray-700">{user?.class_year || 'IT'}</span> •  <span className="text-md text-gray-700">{user?.register_number || 'IT'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Card - Red Card */}
      
      <div className="min-h-[90vh] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {(isLoadingDashboard || isLoadingFines) ? (
          <div className="text-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-15 h-15">
                <Loader />
              </div>
            </div>
          </div>
        ) : (
          <>
          <div className="mb-4">
            <h3 className="text-lg text-center font-semibold text-gray-500 mb-4">Quick Access</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {quickTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link href={tile.href} key={tile.title} className="group block">
                    <div className="h-full rounded-2xl bg-white p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 hover:border-blue-600 ripple" data-ripple>
                      <div className="flex flex-col justify-center items-center gap-3">
                        <div className="h-14 w-14 rounded-lg text-blue-600 flex items-center justify-center">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="text-center text-sm">
                          <div className="text-base font-semibold text-gray-900">{tile.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{tile.hint}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Profile and Finance Summary - Removed profile details as requested */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="rounded-t-xl bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-center">
                  <CardTitle className="text-xl  font-bold text-gray-800">Other Details</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
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
                <div className="sm:px-0 lg:px-8 py-4">
        <Card className="bg-red-50 rounded-xl border-red-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 ">
                  <LogOut className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Logout</h3>
                  <p className="text-sm text-red-600">End your current session</p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => { await logout(); router.push('/'); }}
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
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

// Memoized student dropdown item component
const StudentDropdownItem = memo(({ student, onSelect }: { student: Student, onSelect: (student: Student) => void }) => (
  <div
    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
    onClick={() => onSelect(student)}
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

StudentDropdownItem.displayName = 'StudentDropdownItem'