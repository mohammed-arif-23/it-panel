'use client'

import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { ArrowLeft, User, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { dbHelpers } from '../../lib/supabase'
import Alert from '@/components/ui/alert'

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
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#FFFFFF'}}>
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
    <div className="min-h-screen relative" style={{backgroundColor: '#FFFFFF'}}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
    
      {/* Header with Back Button */}
      <div className="backdrop-blur-md  bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Button variant="ghost" asChild className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300  hover:shadow-xl rounded-xl px-6 py-3 hover:border-blue-300">
              <Link href="/">
                <ArrowLeft className="h-5 w-5 mr-2" />
                
              </Link>
            </Button>
            <div className="flex flex-col items-end bg-white rounded-2xl px-6 py-3">
              <p className="text-xl font-bold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600 font-medium">{user.register_number || 'Student'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2 relative z-10">
        {/* Page Title Section */}
        <div className="mb-8 text-center">
          <div className="bg-white rounded-2xl  p-2 mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Personal Information</h1>
            <p className="text-gray-600 text-sm">Update your profile information to ensure accurate records</p>
          </div>
        </div>
      
        <Card className="bg-white shadow-2xl border-2 border-gray-200 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="bg-blue-50 rounded-t-lg border-b border-gray-200">
            <CardTitle className="text-gray-800 text-xl font-bold">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Registration Number (Read-only) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Register Number (As per Anna University)
                </label>
                <input
                  type="text"
                  value={user.register_number}
                  disabled
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-gray-800 cursor-not-allowed bg-white shadow-inner font-medium"
                />
                <p className="text-xs text-gray-600 mt-2">Register number cannot be modified</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!!user?.name}
                  className={`w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium ${user?.name ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your full name"
                />
                {user?.name && (
                  <p className="text-xs text-gray-600 mt-2">This field is already filled and cannot be modified</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!!user?.email}
                  className={`w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium ${user?.email ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your email address"
                />
                {user?.email && (
                  <p className="text-xs text-gray-600 mt-2">This field is already filled and cannot be modified</p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleInputChange}
                  disabled={!!user?.mobile}
                  className={`w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium ${user?.mobile ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Enter your mobile number"
                />
                {user?.mobile && (
                  <p className="text-xs text-gray-600 mt-2">This field is already filled and cannot be modified</p>
                )}
              </div>

              {/* Class Year */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Class Year
                </label>
                <select
                  name="class_year"
                  required
                  value={formData.class_year}
                  onChange={handleInputChange}
                  disabled={!!user?.class_year}
                  className={`w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-inner text-gray-800 font-medium ${user?.class_year ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select your class year</option>
                  <option value="II-IT">II-IT</option>
                  <option value="III-IT">III-IT</option>
                </select>
                {user?.class_year && (
                  <p className="text-xs text-gray-600 mt-2">This field is already filled and cannot be modified</p>
                )}
              </div>

              {message && (
                <Alert 
                  variant={messageType === 'success' ? 'success' : 'error'} 
                  message={message} 
                  className="mt-4"
                />
              )}

              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-600 hover:border-blue-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Updating Profile...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-3" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
