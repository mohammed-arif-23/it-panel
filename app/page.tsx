'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, BookOpen, Calendar, LogIn, Loader2, Users, Award, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { user, loading, login, logout, hasRegistration } = useAuth()
  const [registerNumber, setRegisterNumber] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLogging(true)
    setError('')

    const result = await login(registerNumber)
    if (!result.success) {
      setError(result.error || 'Login failed')
    }
    setIsLogging(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Loading */}
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[90%] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">        
            <h1 className="text-xl font-bold text-gray-900">Department of Information Technology</h1>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex  items-center justify-center gap-2">
                <LogIn className="h-5 w-5 " />
                Student Login
              </CardTitle>
          
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your registration number"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLogging}
                  className="w-full text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isLogging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Card className="text-center p-4">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-black">NPTEL Courses</h3>
              <p className="text-sm text-black mt-1">Track your course progress</p>
            </Card>
            <Card className="text-center p-4">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-black">Seminar Booking</h3>
              <p className="text-sm text-black mt-1">Book seminar slots</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // User is logged in - show dashboard navigation
  return (
    <div className="min-h-screen pt-4">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-black mb-4">
            Department of Information Technology
          </h2>
        </div>
      {/* User Info and Logout */}
      <div className=" backdrop-blur-sm ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center ">
          { user.name ?( <div className="text-center">
              <h2 className="text-xl font-semibold text-black">
                Welcome, {user.name}
              </h2>
              <p className="text-sm text-black">
                {user.register_number || ''} {user.register_number && user.class_year?'•':''} {user.class_year || ''}
              </p>
            </div>) : (<div className="text-center">
              <p  className='text-red-500 text-sm'>Go to Quick actions and Update Your Profile</p>
            </div>)}
          
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* NPTEL Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">NPTEL Courses</h3>
                  <p className="text-sm text-black">Track your learning progress</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>

                <Button asChild className="w-full mt-4 bg-blue-600 text-white border border-blue-600 hover:bg-blue-700">
                  <Link href="/nptel">Update NPTEL Progress</Link>
                </Button>
            </CardContent>
          </Card>

          {/* Seminar Booking Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Seminar Booking</h3>
                  <p className="text-sm text-black">Book your seminar slots</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
             
                
                <Button asChild className="w-full mt-4 bg-green-600 hover:bg-green-700">
                  <Link href="/seminar" className='text-white'>Book for Seminar</Link>
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>

          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild>
                <Link href="/profile" className='bg-transparent  hover:bg-red-50'>Update Profile</Link>
              </Button>
                <Button 
              variant="outline" 
              onClick={logout}
              className="text-red-600 bg-transparent hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
