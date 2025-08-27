'use client'

import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut, FileText, User, AlertTriangle, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import Alert from '../components/ui/alert'

export default function HomePage() {
  const { user, loading, login, logout, hasRegistration } = useAuth()
  const router = useRouter()
  const [registerNumber, setRegisterNumber] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [finesData, setFinesData] = useState<any>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isLoadingFines, setIsLoadingFines] = useState(false)

  // Check if user profile is complete
  const isProfileComplete = (user: any) => {
    if (!user) return false
    
    // Required fields: name, email, mobile, class_year
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

  // Function to validate if register number belongs to IT department
  const validateITDepartment = (regNumber: string): boolean => {
    // Check if register number has exactly 12 digits
    if (regNumber.length !== 12) {
      return false
    }
    
    // Check if all characters are digits
    if (!/^\d{12}$/.test(regNumber)) {
      return false
    }
    

    const departmentCode = regNumber.substring(6, 9)
    return departmentCode === '205'
  }

  // Function to check if login should be disabled
  const isLoginDisabled = (): boolean => {
    return isLogging || !registerNumber || !validateITDepartment(registerNumber)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)
    setError('')

    // Validate IT department first
    if (!validateITDepartment(registerNumber)) {
      setError('This is only for IT department')
      setIsLogging(false)
      return
    }

    const result = await login(registerNumber)
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    setIsLogging(false)
  }

  const handleRegisterNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Only allow digits
    if (value && !/^\d*$/.test(value)) {
      return // Don't update if non-digits are entered
    }
    
    setRegisterNumber(value)
    
    // Clear previous errors
    setError('')
    
    // Show validation message for various invalid cases
    if (value.length > 0) {
      if (value.length !== 12) {
        setError('Register number must be exactly 12 digits')
      } else if (!validateITDepartment(value)) {
        setError('This is only for IT department')
      }
    }
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
      <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      
      <div className="min-h-[50vh] flex flex-col items-center justify-center  relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">        
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Department of Information Technology</h1>
            <p className="text-gray-600">Student Information System</p>
          </div>

          {/* Video Container */}
          <div className="mb-6 rounded-2xl flex items-center justify-center overflow-hidden">
           <img src={'7408.jpg'} alt="Video" className=' object-contain h-[70%] w-[70%]'></img>
          </div>

          <Card className="backdrop-blur-md bg-white  hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200 text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-gray-800">
                <LogIn className="h-5 w-5" />
                Student Login
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Register Number
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={registerNumber}
                    onChange={handleRegisterNumberChange}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                    placeholder="Enter your 12-digit register number"
                  />
                </div>

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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
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
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )}

  // Dashboard View
  return (
    <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
    
      {/* Clean Professional Header */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200 shadow-sm">
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
                 <span className="font-bold text-md text-gray-700">{user?.name || 'Student'}</span> •  <span className="font-bold text-md text-gray-700">{user?.class_year || 'IT'}</span>             
          •  <span className="font-bold text-md text-gray-700">{user?.register_number || 'IT'}</span>              </p>
              </div>
            
        
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Loading State - Show loading until both dashboard and fines data are loaded */}
        {(isLoadingDashboard || isLoadingFines) ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">One Sec..</h3>
                <p className="text-sm text-gray-600">It's Loading, Be Patient😅...</p>
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
                <CardTitle className="text-xl font-bold text-gray-800 mt-4">
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
                <CardTitle className="text-xl font-bold text-gray-800 mt-4">
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
                <CardTitle className="text-xl font-bold text-gray-800 mt-4">
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
                  <div className="flex items-center justify-between ">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl shadow-lg ${
                        finesData && finesData.stats.totalFines > 0 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                      }`}>
                        <User className="h-6 w-6 text-white" />
                      </div>
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
              
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Enhanced Profile Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Details */}
                    <div className="space-y-6">
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
                    <div className="space-y-6">
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
                          <p className={`text-2xl font-bold ${
                            finesData && finesData.stats.totalFines > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₹{finesData ? finesData.stats.totalFines : 0}
                          </p>
                        </div>
                      </div>
                    
                      {finesData && finesData.stats.totalFines > 0 && (
                        <div className="mt-4 p-4 bg-red-100 rounded-xl border border-red-200">
                          <p className="text-sm text-red-700 font-medium mb-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Action Required
                          </p>
                          <p className="text-xs text-red-600">
                            You are failed to book for seminar.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild className="h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      <Link href="/profile">
                        <User className="h-5 w-5 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
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