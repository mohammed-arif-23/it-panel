'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { ArrowLeft, User, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { dbHelpers } from '../../lib/supabase'

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    class_year: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        class_year: user.class_year || ''
      })
    }
  }, [user, loading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    setMessage('')

    try {
      // Validate form data
      if (!formData.name.trim()) {
        setMessage('Name is required')
        setMessageType('error')
        return
      }

      if (formData.email && !formData.email.includes('@')) {
        setMessage('Please enter a valid email address')
        setMessageType('error')
        return
      }

      if (formData.mobile && !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
        setMessage('Please enter a valid 10-digit mobile number')
        setMessageType('error')
        return
      }

      // Update student details
      const { data, error } = await dbHelpers.updateStudent(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        mobile: formData.mobile.replace(/\D/g, '') || undefined,
        class_year: formData.class_year || undefined
      })

      if (error) {
        console.error('Profile update error:', error)
        setMessage('Failed to update profile. Please try again.')
        setMessageType('error')
        return
      }

      // Refresh user data in context
      await refreshUser()
      
      setMessage('Profile updated successfully!')
      setMessageType('success')
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage('An unexpected error occurred. Please try again.')
      setMessageType('error')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#F7F7E7'}}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-black">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>Redirecting...</div>
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F7F7E7'}}>
    

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration Number (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Register Number (As per Anna University)
                </label>
                <input
                  type="text"
                  value={user.register_number}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black"
                />
                <p className="text-xs text-black mt-1">Register number cannot be modified</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your mobile number"
                />
              </div>

              {/* Class Year */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Class Year
                </label>
                <select
                  name="class_year"
                  required
                  value={formData.class_year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your class year</option>
                  <option value="II-IT">II-IT (Second Year IT)</option>
                  <option value="III-IT">III-IT (Third Year IT)</option>
                </select>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${
                  messageType === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full text-white bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating Profile...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-black">Registration Status</p>
                <p className="text-sm text-black">Active</p>
              </div>
             
              <div>
                <p className="text-sm font-medium text-black">Last Updated</p>
                <p className="text-sm text-black">
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
               <Button variant="ghost" className='mt-4 w-full border text-red-500 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent' asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4  " />
                  Back to Home
                </Link>
              </Button>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}