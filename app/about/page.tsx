'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Info, 
  BookOpen, 
  Calendar, 
  GraduationCap,
  Shield,
  Users,
  Zap,
  Target,
  Award,
  Clock,
  Database
} from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (!user) {
    return <div>Redirecting...</div>
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
              <p className="text-xl font-bold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 font-medium">{user.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mx-auto max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">About System</h1>
            <p className="text-gray-600 text-md">Learn about the unified college platform and its features</p>
          </div>
        </div>
        
        {/* Overview */}
        <Card className="mb-8 bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200 text-center">
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-800">Unified College Application System</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              A comprehensive platform for managing academic progress and seminar bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-700 text-center max-w-2xl mx-auto">
              Our unified system combines NPTEL course tracking and seminar booking functionality 
              into a single, easy-to-use platform designed specifically for students of the 
              Department of Information Technology.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8 bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-gray-800">Key Features</CardTitle>
            <CardDescription className="text-gray-600">
              What makes our system special
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* NPTEL Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  NPTEL Course Tracking
                </h3>
                <div className="space-y-3 ml-7">
                  <div className="flex items-start space-x-3">
                    <Target className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Progress Tracking</h4>
                      <p className="text-sm text-gray-600">Monitor your weekly assignment completion status</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Time-based Unlocking</h4>
                      <p className="text-sm text-gray-600">Weeks unlock automatically based on your progress timeline</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Visual Progress</h4>
                      <p className="text-sm text-gray-600">Clear visual indicators of your course completion status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seminar Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-600" />
                  Seminar Booking
                </h3>
                <div className="space-y-3 ml-7">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Real-time Booking</h4>
                      <p className="text-sm text-gray-600">Live booking windows with countdown timers</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Fair Selection</h4>
                      <p className="text-sm text-gray-600">Automated random selection from all bookings at midnight</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">Secure System</h4>
                      <p className="text-sm text-gray-600">One booking per student per day policy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card className="mb-8 bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-gray-800">Technical Specifications</CardTitle>
            <CardDescription className="text-gray-600">
              Built with modern technology for reliability and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-800 mb-2">Database</h4>
                <p className="text-sm text-gray-600">PostgreSQL with Supabase for real-time data management</p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-800 mb-2">Frontend</h4>
                <p className="text-sm text-gray-600">Next.js 15 with React for fast, responsive user interface</p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-800 mb-2">Security</h4>
                <p className="text-sm text-gray-600">Row-level security and authentication for data protection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-gray-800">System Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Version</h4>
                <p className="text-gray-600">1.0.0</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Last Updated</h4>
                <p className="text-gray-600">August 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}