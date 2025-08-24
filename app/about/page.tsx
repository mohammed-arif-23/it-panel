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
    <div className="min-h-screen" style={{backgroundColor: '#F7F7E7'}}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Info className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-black">
                    About System
                  </h1>
                  <p className="text-sm text-black">Learn about the unified college platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Unified College Application System</CardTitle>
            <CardDescription className="text-lg">
              A comprehensive platform for managing academic progress and seminar bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-black text-center max-w-2xl mx-auto">
              Our unified system combines NPTEL course tracking and seminar booking functionality 
              into a single, easy-to-use platform designed specifically for students of the 
              Department of Information Technology.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>
              What makes our system special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* NPTEL Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  NPTEL Course Tracking
                </h3>
                <div className="space-y-3 ml-7">
                  <div className="flex items-start space-x-3">
                    <Target className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-black">Progress Tracking</h4>
                      <p className="text-sm text-black">Monitor your weekly assignment completion status</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-black">Time-based Unlocking</h4>
                      <p className="text-sm text-black">Weeks unlock automatically based on your progress timeline</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-4 w-4 mt-1 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-black">Visual Progress</h4>
                      <p className="text-sm text-black">Clear visual indicators of your course completion status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seminar Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-600" />
                  Seminar Booking
                </h3>
                <div className="space-y-3 ml-7">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-black">Real-time Booking</h4>
                      <p className="text-sm text-black">Live booking windows with countdown timers</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-black">Fair Selection</h4>
                      <p className="text-sm text-black">Automated random selection from all bookings</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="h-4 w-4 mt-1 text-green-600" />
                    <div>
                      <h4 className="font-medium text-black">Secure System</h4>
                      <p className="text-sm text-black">One booking per student per day policy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>
              Built with modern technology for reliability and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Database className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Database</h4>
                <p className="text-sm text-black">PostgreSQL with Supabase for real-time data management</p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Frontend</h4>
                <p className="text-sm text-black">Next.js 15 with React for fast, responsive user interface</p>
              </div>
              
              <div className="text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-black mb-2">Security</h4>
                <p className="text-sm text-black">Row-level security and authentication for data protection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-black mb-3">Version Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">System Version:</span>
                    <span className="text-black">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Last Updated:</span>
                    <span className="text-black">January 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Framework:</span>
                    <span className="text-black">Next.js 15</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-black mb-3">Support Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Developed by:</span>
                    <span className="text-black">IT Department</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Maintained by:</span>
                    <span className="text-black">System Admin Team</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Support:</span>
                    <span className="text-black">support@college.edu</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Ready to use the system? Here are some quick actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex-col">
                <Link href="/">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-sm">Go to Dashboard</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/profile">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Update Profile</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/help">
                  <Info className="h-6 w-6 mb-2" />
                  <span className="text-sm">Get Help</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 flex-col">
                <Shield className="h-6 w-6 mb-2" />
                <span className="text-sm">Contact Admin</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}