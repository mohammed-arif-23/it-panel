'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ArrowLeft, CheckCircle, Loader2, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import Alert from '@/components/ui/alert'

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#FFFFFF'}}>
        <Card className="w-full max-w-md text-center bg-white shadow-2xl border-2 border-gray-200">
          <CardContent className="pt-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
            <p className="text-gray-700 mb-4">
              You have been successfully registered for seminar booking.
            </p>
            <p className="text-sm text-gray-600">
              Redirecting to your seminar dashboard...
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
            <h1 className="text-4xl font-bold text-gray-800 mb-3">Seminar Registration</h1>
            <p className="text-gray-600 text-md">Register for seminar booking to present your work</p>
          </div>
        </div>
        
        {/* Registration Card */}
        <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-green-50 rounded-t-lg border-b border-gray-200 text-center">
            <CardTitle className="text-gray-800 text-xl font-bold">Register for Seminar Booking</CardTitle>
            <CardDescription className="text-gray-600">
              Join the seminar booking system to reserve your presentation slots
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">Your Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Registration Number:</span>
                    <span className="font-medium text-gray-800">{user?.register_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Name:</span>
                    <span className="font-medium text-gray-800">{user?.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Class:</span>
                    <span className="font-medium text-gray-800">{user?.class_year || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-900 mb-3">Seminar Booking Features:</h4>
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
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-3">How Booking Works:</h4>
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
                <Alert 
                  variant="error" 
                  message={error} 
                  className="mt-4"
                />
              )}

              <Button
                onClick={handleRegistration}
                disabled={isRegistering}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-green-600 hover:border-green-700"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Registering...
                  </>
                ) : (
                  "Register for Seminar Booking"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
