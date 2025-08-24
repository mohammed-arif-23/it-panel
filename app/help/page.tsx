'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  HelpCircle, 
  BookOpen, 
  Calendar, 
  Mail, 
  Phone, 
  MessageCircle,
  FileText,
  Settings,
  Users
} from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
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
                  <HelpCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-black">
                    Help & Support
                  </h1>
                  <p className="text-sm text-black">Get assistance with the system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions and answers about the unified college system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* NPTEL FAQ */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                NPTEL Course Tracking
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <h4 className="font-medium text-black">How do I register for NPTEL tracking?</h4>
                  <p className="text-black mt-1">
                    Navigate to the NPTEL section from the home page and click "Register for NPTEL". 
                    You'll be able to add your course details and start tracking your progress.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">How does week unlocking work?</h4>
                  <p className="text-black mt-1">
                    Each week unlocks automatically after you mark the previous week as completed. 
                    Week 1 is always available. Subsequent weeks unlock based on your progress timeline.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">Can I modify my course progress?</h4>
                  <p className="text-black mt-1">
                    Yes, you can update your weekly progress status from "Not Started" to "In Progress" 
                    to "Completed" as you work through your assignments.
                  </p>
                </div>
              </div>
            </div>

            {/* Seminar FAQ */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Seminar Booking
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <h4 className="font-medium text-black">When can I book seminar slots?</h4>
                  <p className="text-black mt-1">
                    Booking windows are open daily during specific time periods. 
                    You can book for the next day's seminar during the active booking window.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">How does the selection process work?</h4>
                  <p className="text-black mt-1">
                    After the booking window closes, a random selection is made from all students 
                    who booked for that day. The selected student will be notified.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">Can I cancel my booking?</h4>
                  <p className="text-black mt-1">
                    Yes, you can cancel your booking as long as the booking window is still open. 
                    Once the window closes, bookings cannot be modified.
                  </p>
                </div>
              </div>
            </div>

            {/* General FAQ */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-black" />
                General System
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <h4 className="font-medium text-black">How do I update my profile information?</h4>
                  <p className="text-black mt-1">
                    Click on "Update Profile" from the Quick Actions section on the home page. 
                    You can update your name, email, mobile number, and class year.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">What if I forgot my registration number?</h4>
                  <p className="text-black mt-1">
                    Contact the system administrator or your department for assistance with 
                    retrieving your registration number.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-black">Is my data secure?</h4>
                  <p className="text-black mt-1">
                    Yes, all data is stored securely with proper authentication and encryption. 
                    Only you can access your personal information and progress data.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>
              Need additional help? Get in touch with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-black">Email Support</h4>
                    <p className="text-black">support@college.edu</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-black">Phone Support</h4>
                    <p className="text-black">+91 XXX-XXX-XXXX</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-black">Live Chat</h4>
                    <p className="text-black">Available Mon-Fri, 9 AM - 5 PM</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Office Hours</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                    <p>Saturday: 10:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Response Time</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>Email: Within 24 hours</p>
                    <p>Phone: Immediate during office hours</p>
                    <p>Chat: Within 5 minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Commonly used features and pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/profile">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Update Profile</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/nptel">
                  <BookOpen className="h-6 w-6 mb-2" />
                  <span className="text-sm">NPTEL Dashboard</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/seminar">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="text-sm">Seminar Booking</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col">
                <Link href="/about">
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">About System</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}