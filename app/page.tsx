'use client'

import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut, FileText, User, Info } from 'lucide-react'
import Link from 'next/link'
import Alert from '../components/ui/alert'

export default function HomePage() {
  const { user, loading, login, logout, hasRegistration } = useAuth()
  const router = useRouter()
  const [registerNumber, setRegisterNumber] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

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
    console.log('Profile check - Loading:', loading, 'User:', user)
    if (user) {
      console.log('User details:', {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        class_year: user.class_year
      })
      console.log('Profile complete:', isProfileComplete(user))
    }
    
    // Only check profile completeness after loading is done and user exists
    if (!loading && user) {
      const profileComplete = isProfileComplete(user)
      console.log('Profile complete result:', profileComplete)
      
      if (!profileComplete) {
        console.log('Redirecting to profile - incomplete profile detected')
        setIsRedirecting(true)
        router.push('/profile')
        return
      }
    }
  }, [user, loading, router])

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
    
      {/* Header */}
      <div className="backdrop-blur-md border-b bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Department of IT</h1>
                <p className="text-sm text-gray-600">{user?.class_year}</p>
              </div>
            </div>
            <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3 ">
              <p className="text-md font-bold text-gray-800">{user?.name || 'Student'}</p>
              <p className="text-sm text-gray-600 font-medium">{user?.register_number || 'Register Number'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
       
      
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* NPTEL Card */}
          <Card className="bg-white shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-800">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                NPTEL Courses
              </CardTitle>
              <CardDescription className="text-gray-600">
                Track your course progress and assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>View and manage your courses</span>
                </div>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/nptel">
                    Access NPTEL Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seminar Card */}
          <Card className="bg-white shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-green-50 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-800">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Seminar Booking
              </CardTitle>
              <CardDescription className="text-gray-600">
                Book your seminar slots and view selections
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-2" />
                  <span>Book and track your presentations</span>
                </div>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Link href="/seminar">
                    Access Seminar Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Card */}
          <Card className="bg-white shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-800">
                <FileText className="h-5 w-5 mr-2 text-purple-600" />
                Assignments
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and submit your assignments
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Submit and track assignments</span>
                </div>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Link href="/assignments">
                    View Assignments
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile and About Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Profile Card */}
          <Card className="bg-white shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gray-50 rounded-t-lg">
              <CardTitle className="flex items-center text-gray-800">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                My Profile
              </CardTitle>
              <CardDescription className="text-gray-600">
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>Manage your profile details</span>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/profile">
                    Edit Profile
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex text-red border border-red items-center justify-center"
                  onClick={async () => {
                    await logout();
                    router.push('/');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>

         
        </div>
      </div>
    </div>
  )
}