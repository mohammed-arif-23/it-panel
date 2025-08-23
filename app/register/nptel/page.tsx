'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { dbHelpers } from '@/lib/supabase'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Registration Successful!</h2>
            <p className="text-black mb-4">
              You have been successfully registered for NPTEL courses.
            </p>
            <p className="text-sm text-black">
              Redirecting to your NPTEL dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">
                  NPTEL Course Registration
                </h1>
                <p className="text-sm text-gray-700">Register for NPTEL courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register for NPTEL Courses</CardTitle>
            <CardDescription>
              Enter your course details to start tracking your NPTEL progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistration} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Programming, Data Structures and Algorithms using Python"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., NPTEL23CS04"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Course Duration (weeks)
                </label>
                <select
                  value={courseDetails.duration}
                  onChange={(e) => setCourseDetails(prev => ({ 
                    ...prev, 
                    duration: Number(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={8}>8 weeks</option>
                  <option value={12}>12 weeks</option>
                  <option value={16}>16 weeks</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What you'll get:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Weekly assignment progress tracking</li>
                  <li>• Visual progress indicators</li>
                  <li>• Time-based week unlocking system</li>
                  <li>• Performance analytics and insights</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  'Register for NPTEL'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About NPTEL</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-black">
                NPTEL (National Programme on Technology Enhanced Learning) is a joint initiative 
                by IITs and IISc to offer online courses in engineering, science, and management.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-black">
                Track your weekly assignments, monitor progress with visual indicators, 
                and stay on schedule with our time-based unlocking system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}