'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ArrowLeft, CheckCircle, Loader2, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default function SeminarRegistrationPage() {
  const { user, registerForService, hasRegistration } = useAuth()
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/')
      return
    }

    // Redirect if already registered
    if (hasRegistration('seminar')) {
      router.push('/seminar')
      return
    }
  }, [user, hasRegistration, router])

  const handleRegistration = async () => {
    if (!user) return

    setIsRegistering(true)
    setError('')

    try {
      const result = await registerForService('seminar')
      if (!result.success) {
        setError(result.error || 'Registration failed')
        setIsRegistering(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/seminar')
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
              You have been successfully registered for seminar booking.
            </p>
            <p className="text-sm text-black">
              Redirecting to your seminar dashboard...
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
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-black">
                  Seminar Booking Registration
                </h1>
                <p className="text-sm text-black">Register for seminar booking system</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Registration Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Register for Seminar Booking</CardTitle>
            <CardDescription>
              Join the seminar booking system to reserve your presentation slots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-black mb-2">Your Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Registration Number:</span>
                    <span className="font-medium">{user.register_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Name:</span>
                    <span className="font-medium">{user.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Class:</span>
                    <span className="font-medium">{user.class_year || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Seminar Booking Features:</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Daily Booking Windows</p>
                      <p className="text-sm text-green-700">Book seminars during 6:00 PM - 11:59 PM daily</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Random Selection</p>
                      <p className="text-sm text-green-700">Fair automatic selection from all bookings at midnight</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Real-time Status</p>
                      <p className="text-sm text-green-700">Track your booking status and selection history</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Schedule */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">How Booking Works:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span><strong>6:00 PM - 11:59 PM:</strong> Booking window open</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span><strong>12:00 AM:</strong> Random selection from bookings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span><strong>Next Day:</strong> Selected student presents</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleRegistration}
                disabled={isRegistering}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  'Register for Seminar Booking'
                )}
              </Button>

              <p className="text-xs text-center text-black">
                By registering, you agree to participate in the seminar booking system 
                and present when selected.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fair Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-black">
                Our random selection system ensures every student has an equal opportunity 
                to present, making the process fair and transparent.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Easy Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-black">
                Simple one-click booking during the daily window. No complex forms 
                or lengthy processes - just book and wait for selection results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}