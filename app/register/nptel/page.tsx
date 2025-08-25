'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { dbHelpers } from '@/lib/supabase'
import Alert from '@/components/ui/alert'

export default function NPTELRegistrationPage() {
  const { user, registerForService, hasRegistration } = useAuth()
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [courseDetails, setCourseDetails] = useState({
    courseName: '',
    courseId: '',
    duration: 12
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/')
      return
    }

    // Redirect if already registered
    if (hasRegistration('nptel')) {
      router.push('/nptel')
      return
    }
  }, [user, hasRegistration, router])

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsRegistering(true)
    setError('')

    try {
      // Register for NPTEL service
      const registrationResult = await registerForService('nptel')
      if (!registrationResult.success) {
        setError(registrationResult.error || 'Registration failed')
        setIsRegistering(false)
        return
      }

      // Create NPTEL enrollment
      const enrollmentResult = await dbHelpers.createNPTELEnrollment(
        user.id,
        courseDetails.courseName,
        courseDetails.courseId,
        courseDetails.duration
      )

      if (enrollmentResult.error) {
        setError('Failed to create course enrollment')
        setIsRegistering(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/nptel')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsRegistering(false)
    }
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#FFFFFF'}}>
        <Card className="w-full max-w-md text-center bg-white shadow-2xl border-2 border-gray-200">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
            <p className="text-gray-700 mb-4">
              You have been successfully registered for NPTEL courses.
            </p>
            <p className="text-sm text-gray-600">
              Redirecting to your NPTEL dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
              <p className="text-xl font-bold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-600 font-medium">{user?.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">NPTEL Registration</h1>
            <p className="text-gray-600 text-md">Register for NPTEL courses to track your progress</p>
          </div>
        </div>
        
        {/* Registration Form */}
        <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-gray-800 text-xl font-bold">Register for NPTEL Courses</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your course details to start tracking your NPTEL progress
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  NPTEL Course Name *
                </label>
                <input
                  type="text"
                  required
                  value={courseDetails.courseName}
                  onChange={(e) => setCourseDetails(prev => ({ 
                    ...prev, 
                    courseName: e.target.value 
                  }))}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                  placeholder="e.g., Programming, Data Structures and Algorithms using Python"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Course ID *
                </label>
                <input
                  type="text"
                  required
                  value={courseDetails.courseId}
                  onChange={(e) => setCourseDetails(prev => ({ 
                    ...prev, 
                    courseId: e.target.value 
                  }))}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                  placeholder="e.g., NPTEL23CS04"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Course Duration (weeks)
                </label>
                <select
                  value={courseDetails.duration}
                  onChange={(e) => setCourseDetails(prev => ({ 
                    ...prev, 
                    duration: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium"
                >
                  <option value={8}>8 weeks</option>
                  <option value={12}>12 weeks</option>
                  <option value={16}>16 weeks</option>
                </select>
              </div>

              {error && (
                <Alert 
                  variant="error" 
                  message={error} 
                  className="mt-4"
                />
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-2">What you'll get:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Weekly progress tracking</li>
                  <li>• Automated assignment unlocking</li>
                  <li>• Visual completion indicators</li>
                  <li>• Performance analytics</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
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